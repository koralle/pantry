import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
import type { ContractRouterClient } from "@orpc/contract";
import { contract } from "@pantry/api-contract";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "./app";

type App = ReturnType<typeof createApp>;
type Client = ContractRouterClient<typeof contract>;

const rpcUrl = "http://api.test/rpc";

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
    plugins: [new SimpleCsrfProtectionLinkPlugin()],
    url: rpcUrl,
  });

  return createORPCClient<Client>(link);
};

/** DB を使わない procedure だけを叩くテストの差し込み口。 */
const unusedDb = (): never => {
  throw new Error("db is not used in this test");
};

const unusedAuthHandler = async () => new Response("unused");

describe("createApp", () => {
  it("health は認証なしで ok を返す", async () => {
    const authenticate = vi.fn(async () => null);
    const app = createApp({
      authenticate,
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
    });

    await expect(createClient(app).health()).resolves.toStrictEqual({
      status: "ok",
    });
    expect(authenticate).not.toHaveBeenCalled();
  });

  it("x-csrf-token ヘッダーが無い procedure 呼び出しは 403 で拒否し、認証もしない", async () => {
    const authenticate = vi.fn(async () => null);
    const app = createApp({
      authenticate,
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
    });

    const response = await app.request(`${rpcUrl}/me`, {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      json: { code: "CSRF_TOKEN_MISMATCH", status: 403 },
    });
    expect(authenticate).not.toHaveBeenCalled();
  });

  it("x-csrf-token の値が違えば 403 で拒否する", async () => {
    const app = createApp({
      authenticate: async () => null,
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
    });

    const response = await app.request(`${rpcUrl}/health`, {
      body: JSON.stringify({}),
      headers: {
        "content-type": "application/json",
        "x-csrf-token": "forged",
      },
      method: "POST",
    });

    expect(response.status).toBe(403);
  });

  it("me は authenticator が解決したユーザーを返す", async () => {
    const app = createApp({
      authenticate: async () => ({
        email: "koralle@example.com",
        id: "user_1",
        name: "koralle",
      }),
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
    });

    await expect(createClient(app).me()).resolves.toStrictEqual({
      email: "koralle@example.com",
      id: "user_1",
      name: "koralle",
    });
  });

  it("me はユーザーが解決できなければ 401 を返す", async () => {
    const app = createApp({
      authenticate: async () => null,
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
    });

    await expect(createClient(app).me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
  });

  it("procedure の想定外の失敗は reportError に渡し、client には 500 だけを返す", async () => {
    const failure = new Error("db is down");
    const reportError = vi.fn();
    const app = createApp({
      authenticate: async () => {
        throw failure;
      },
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
      reportError,
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

  it("4xx の ORPCError は reportError に渡さない", async () => {
    const reportError = vi.fn();
    const app = createApp({
      authenticate: async () => null,
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
      reportError,
    });

    await expect(createClient(app).me()).rejects.toMatchObject({
      status: 401,
    });
    expect(reportError).not.toHaveBeenCalled();
  });

  it("/api/auth/* のリクエストを handleAuthRequest へ委譲する", async () => {
    const handleAuthRequest = vi.fn(async (request: Request) =>
      Response.json({ url: request.url }, { status: 202 })
    );
    const app = createApp({
      authenticate: async () => null,
      db: unusedDb,
      handleAuthRequest,
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

  it("未知の path は 404 を返す", async () => {
    const app = createApp({
      authenticate: async () => null,
      db: unusedDb,
      handleAuthRequest: unusedAuthHandler,
    });

    const response = await app.request("http://api.test/unknown");

    expect(response.status).toBe(404);
  });
});
