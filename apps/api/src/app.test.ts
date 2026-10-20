import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
import type { ContractRouterClient } from "@orpc/contract";
import { contract } from "@pantry/api-contract";
import { describe, expect, test, vi } from "vitest";

import { createApp } from "./app";

type App = ReturnType<typeof createApp>;
type Client = ContractRouterClient<typeof contract>;

const rpcUrl = "http://api.test/rpc";
const trustedOrigin = () => "http://pantry.test";

const createClient = (app: App, cookie?: string): Client => {
  const link = new RPCLink({
    fetch: async (request) => {
      if (cookie === undefined) {
        return await app.fetch(request);
      }

      const headers = new Headers(request.headers);
      headers.set("cookie", cookie);

      return await app.fetch(new Request(request, { headers }));
    },
    url: rpcUrl,
  });

  return createORPCClient<Client>(link);
};

const unusedDb = (): never => {
  throw new Error("db is not used in this test");
};

const unusedAuthHandler = async () => new Response("unused");

describe("createApp", () => {
  test("health は認証なしで ok を返す", async () => {
    const authenticate = vi.fn(async () => null);
    const app = createApp({
      authenticate,
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
      trustedOrigin,
    });

    await expect(createClient(app).health()).resolves.toStrictEqual({
      status: "ok",
    });
    expect(authenticate).not.toHaveBeenCalled();
  });

  test("x-csrf-token を付ける今の web の client も通す", async () => {
    const user = {
      email: "koralle@example.com",
      id: "user_1",
      name: "koralle",
    };
    const app = createApp({
      authenticate: async () => user,
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
      trustedOrigin,
    });
    const currentWebClient = createORPCClient<Client>(
      new RPCLink({
        fetch: async (request) => await app.fetch(request),
        plugins: [new SimpleCsrfProtectionLinkPlugin()],
        url: rpcUrl,
      })
    );

    await expect(currentWebClient.health()).resolves.toStrictEqual({
      status: "ok",
    });
    await expect(currentWebClient.me()).resolves.toStrictEqual(user);
  });

  test("Origin の無い JSON（SSR）の未認証 me は CSRF ではなく 401 を返す", async () => {
    const app = createApp({
      authenticate: async () => null,
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
      trustedOrigin,
    });

    const response = await app.request(`${rpcUrl}/me`, {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      json: { code: "UNAUTHORIZED", status: 401 },
    });
  });

  test("me は authenticator が解決したユーザーを返す", async () => {
    const app = createApp({
      authenticate: async () => ({
        email: "koralle@example.com",
        id: "user_1",
        name: "koralle",
      }),
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
      trustedOrigin,
    });

    await expect(createClient(app).me()).resolves.toStrictEqual({
      email: "koralle@example.com",
      id: "user_1",
      name: "koralle",
    });
  });

  test("me はユーザーが解決できなければ 401 を返す", async () => {
    const app = createApp({
      authenticate: async () => null,
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
      trustedOrigin,
    });

    await expect(createClient(app).me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
  });

  test("procedure の想定外の失敗は reportError に渡し、client には 500 だけを返す", async () => {
    const failure = new Error("db is down");
    const reportError = vi.fn();
    const app = createApp({
      authenticate: async () => {
        throw failure;
      },
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
      reportError,
      trustedOrigin,
    });

    const rejection: unknown = await createClient(app)
      .me()
      .catch((error: unknown) => error);

    expect(rejection).toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      status: 500,
    });
    expect(rejection).not.toMatchObject({ message: "db is down" });
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(failure);
  });

  test("4xx の ORPCError は reportError に渡さない", async () => {
    const reportError = vi.fn();
    const app = createApp({
      authenticate: async () => null,
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
      reportError,
      trustedOrigin,
    });

    await expect(createClient(app).me()).rejects.toMatchObject({
      status: 401,
    });
    expect(reportError).not.toHaveBeenCalled();
  });

  test("/api/auth/* のリクエストを handleAuthRequest へ委譲する", async () => {
    const handleAuthRequest = vi.fn(async (request: Request) =>
      Response.json({ url: request.url }, { status: 202 })
    );
    const app = createApp({
      authenticate: async () => null,
      db: unusedDb,
      handleAuthRequest,
      trustedOrigin,
    });

    const response = await app.request(
      "http://api.test/api/auth/get-session?foo=bar"
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toStrictEqual({
      url: "http://api.test/api/auth/get-session?foo=bar",
    });
    expect(handleAuthRequest).toHaveBeenCalledTimes(1);
  });

  test("別サイトの form は HTTPException のまま 403 の plain text で返し、500 にも記録にもしない", async () => {
    const reportError = vi.fn();
    const app = createApp({
      authenticate: async () => null,
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
      reportError,
      trustedOrigin,
    });

    const response = await app.request(`${rpcUrl}/me`, {
      body: "json=%7B%7D",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://evil.example",
        "sec-fetch-site": "cross-site",
      },
      method: "POST",
    });

    expect(response.status).toBe(403);
    await expect(response.text()).resolves.toBe("Forbidden");
    expect(reportError).not.toHaveBeenCalled();
  });

  test("CSRF の検査は /rpc だけに掛け、/api/auth/* は better-auth に任せる", async () => {
    const handleAuthRequest = vi.fn(async () => new Response("auth"));
    const app = createApp({
      authenticate: async () => null,
      db: unusedDb,
      handleAuthRequest,
      trustedOrigin,
    });

    const response = await app.request("http://api.test/api/auth/sign-out", {
      body: "x=1",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://evil.example",
        "sec-fetch-site": "cross-site",
      },
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(handleAuthRequest).toHaveBeenCalledTimes(1);
  });

  test("信頼する Origin を決められなければ、JSON でも /rpc を 500 で閉じ続け、記録は 1 度だけにする（fail closed）", async () => {
    const failure = new Error("BETTER_AUTH_URL is not set");
    const authenticate = vi.fn(async () => null);
    const reportError = vi.fn();
    const failingTrustedOrigin = vi.fn((): string => {
      throw failure;
    });
    const app = createApp({
      authenticate,
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
      reportError,
      trustedOrigin: failingTrustedOrigin,
    });

    for (const path of ["health", "me", "health"]) {
      const response = await app.request(`${rpcUrl}/${path}`, {
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      expect(response.status).toBe(500);
      await expect(response.text()).resolves.not.toContain("BETTER_AUTH_URL");
    }
    expect(failingTrustedOrigin).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(failure);
    expect(authenticate).not.toHaveBeenCalled();
  });

  test.each(["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "DELETE"])(
    "%s /rpc/me は procedure に届かず 405（Allow: POST）を返す",
    async (method) => {
      const authenticate = vi.fn(async () => ({
        email: "koralle@example.com",
        id: "user_1",
        name: "koralle",
      }));
      const app = createApp({
        authenticate,
        db: unusedDb,
        handleAuthRequest: unusedAuthHandler,
        trustedOrigin,
      });

      const response = await app.request(`${rpcUrl}/me`, { method });

      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("POST");
      expect(authenticate).not.toHaveBeenCalled();
    }
  );

  test("未知の path は 404 を返す", async () => {
    const app = createApp({
      authenticate: async () => null,
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
      trustedOrigin,
    });

    const response = await app.request("http://api.test/unknown");

    expect(response.status).toBe(404);
  });
});
