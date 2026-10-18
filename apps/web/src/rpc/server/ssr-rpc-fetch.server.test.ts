import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { describe, expect, test, vi } from "vitest";

import { stubAppRouterDeps } from "../contract/test-deps";

const mocks = vi.hoisted(() => ({
  getRequestHeaders: vi.fn<() => Headers>(),
}));

// SSR の request scope を差し替える。実環境では loader 実行中の元リクエストが来る。
vi.mock("@tanstack/react-start/server", () => ({
  getRequestHeaders: () => mocks.getRequestHeaders(),
}));

import { createAppRouter } from "../contract/create-app-router";
import type { AppRouter } from "../contract/create-app-router";
import { ssrRpcFetch } from "./ssr-rpc-fetch.server";

function capturingSessionRouter() {
  const capturedCookies: (string | null)[] = [];
  const capturedHeaders: Headers[] = [];
  const getSession = vi.fn(async (headers: Headers) => {
    capturedCookies.push(headers.get("cookie"));
    capturedHeaders.push(headers);
    return {
      email: "user-1@example.com",
      id: "user-1",
      name: "koralle",
    };
  });
  const router = createAppRouter({
    ...stubAppRouterDeps(),
    fetchPageTitle: async () => ({ kind: "unavailable" }),
    getSession,
  });

  return { capturedCookies, capturedHeaders, router };
}

/**
 * RPCLink から ssrRpcFetch へ繋ぎ、SSR 中のヘッダー転送だけを見る。
 * HTTP サーバーは立てず、process 内の handler へ流す。
 */
function clientThroughSsr(router: AppRouter, linkHeaders?: HeadersInit) {
  const link = new RPCLink({
    fetch: async (request) => await ssrRpcFetch(request, router),
    headers: () => new Headers(linkHeaders),
    url: "https://pantry.test/api/rpc",
  });
  const client: RouterClient<AppRouter> = createORPCClient(link);

  return client;
}

describe(ssrRpcFetch, () => {
  test("元リクエストの cookie を handler へ転送する", async () => {
    mocks.getRequestHeaders.mockReturnValue(
      new Headers({ cookie: "better-auth.session_token=ssr-cookie" })
    );
    const { router, capturedCookies } = capturingSessionRouter();
    const client = clientThroughSsr(router);

    const result = await client.bookmarks.list({});

    expect(result).toStrictEqual({ items: [], nextCursor: null });
    expect(capturedCookies).toStrictEqual([
      "better-auth.session_token=ssr-cookie",
    ]);
  });

  test("元リクエストのクライアント IP のヘッダーも転送し、ほかは転送しない", async () => {
    mocks.getRequestHeaders.mockReturnValue(
      new Headers({
        authorization: "Bearer should-not-leak",
        "cf-connecting-ip": "203.0.113.7",
        cookie: "better-auth.session_token=ssr-cookie",
        "x-forwarded-for": "203.0.113.7",
      })
    );
    const { router, capturedHeaders } = capturingSessionRouter();
    const client = clientThroughSsr(router);

    await client.bookmarks.list({});

    expect(capturedHeaders[0]?.get("cf-connecting-ip")).toBe("203.0.113.7");
    expect(capturedHeaders[0]?.get("x-forwarded-for")).toBe("203.0.113.7");
    expect(capturedHeaders[0]?.get("authorization")).toBeNull();
  });

  test("link が明示的に載せた cookie は上書きしない", async () => {
    mocks.getRequestHeaders.mockReturnValue(
      new Headers({ cookie: "better-auth.session_token=server-cookie" })
    );
    const { router, capturedCookies } = capturingSessionRouter();
    const client = clientThroughSsr(router, { cookie: "link-cookie=explicit" });

    await client.bookmarks.list({});

    expect(capturedCookies).toStrictEqual(["link-cookie=explicit"]);
  });
});
