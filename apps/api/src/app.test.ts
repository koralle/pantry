import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
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
    url: rpcUrl,
  });

  return createORPCClient<Client>(link);
};

const unusedAuthHandler = async () => new Response("unused");

describe("createApp", () => {
  it("health は認証なしで ok を返す", async () => {
    const authenticate = vi.fn(async () => null);
    const app = createApp({
      authenticate,
      handleAuthRequest: unusedAuthHandler,
    });

    await expect(createClient(app).health()).resolves.toStrictEqual({
      status: "ok",
    });
    expect(authenticate).not.toHaveBeenCalled();
  });

  it("me は authenticator が解決したユーザーを返す", async () => {
    const app = createApp({
      authenticate: async () => ({
        email: "koralle@example.com",
        id: "user_1",
        name: "koralle",
      }),
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
      handleAuthRequest: unusedAuthHandler,
    });

    await expect(createClient(app).me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
  });

  it("/api/auth/* のリクエストを handleAuthRequest へ委譲する", async () => {
    const handleAuthRequest = vi.fn(async (request: Request) =>
      Response.json({ url: request.url }, { status: 202 })
    );
    const app = createApp({
      authenticate: async () => null,
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
      handleAuthRequest: unusedAuthHandler,
    });

    const response = await app.request("http://api.test/unknown");

    expect(response.status).toBe(404);
  });
});
