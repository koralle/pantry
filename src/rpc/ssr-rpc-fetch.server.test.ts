import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRequestHeaders: vi.fn<() => Headers>(),
}));

// SSR の request scope を差し替える。実環境では loader 実行中の元リクエストが来る。
vi.mock("@tanstack/react-start/server", () => ({
  getRequestHeaders: () => mocks.getRequestHeaders(),
}));

import type { TagId } from "../features/tags/domain/tag-values";
import { createAppRouter } from "./create-app-router";
import type { AppRouter } from "./create-app-router";
import { ssrRpcFetch } from "./ssr-rpc-fetch.server";

function capturingSessionRouter() {
  const capturedCookies: (string | null)[] = [];
  const getSession = vi.fn(async (headers: Headers) => {
    capturedCookies.push(headers.get("cookie"));
    return {
      email: "user-1@example.com",
      id: "user-1",
      name: "koralle",
    };
  });
  const router = createAppRouter({
    fetchPageTitle: async () => ({ kind: "unavailable" }),
    findBookmarkEditor: async () => null,
    findTagById: async () => null,
    getBookmarkDetail: async () => null,
    getSession,
    insertBookmark: async () => ({ kind: "duplicate-url" }),
    insertTag: async () => ({ id: 1 as TagId, kind: "created" }),
    listBookmarks: async () => ({ items: [], nextCursor: null }),
    listShelfTags: async () => [],
    listTags: async () => [],
    softDeleteBookmark: async () => ({ kind: "bookmark-not-found" }),
    touchTag: async () => ({ kind: "touched" }),
    updateBookmark: async () => ({ kind: "bookmark-not-found" }),
    updateTag: async () => ({ kind: "not-found" }),
  });

  return { capturedCookies, router };
}

/**
 * RPCLink から ssrRpcFetch へ繋ぎ、SSR 中の Cookie 転送だけを見る。
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

    const result = await client.bookmarks.list({
      sort: "newest",
      tagMode: "and",
    });

    expect(result).toStrictEqual({ items: [], nextCursor: null });
    expect(capturedCookies).toStrictEqual([
      "better-auth.session_token=ssr-cookie",
    ]);
  });

  test("link が明示的に載せた cookie は上書きしない", async () => {
    mocks.getRequestHeaders.mockReturnValue(
      new Headers({ cookie: "better-auth.session_token=server-cookie" })
    );
    const { router, capturedCookies } = capturingSessionRouter();
    const client = clientThroughSsr(router, { cookie: "link-cookie=explicit" });

    await client.bookmarks.list({ sort: "newest", tagMode: "and" });

    expect(capturedCookies).toStrictEqual(["link-cookie=explicit"]);
  });
});
