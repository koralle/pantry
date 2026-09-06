import { describe, expect, test } from "vitest";

describe("server direct RPC client", () => {
  // Client.server 経由の初回は react-start/server の graph ごと読むため、
  // Workerd 上の初回呼び出しは既定の 5 秒に収まらないことがある。
  test("request headers の Cookie が procedure の getSession へ届く", async () => {
    const { createAppRouter } = await import("./create-app-router");
    const { createServerRpcClient } = await import("./client.server");

    let receivedCookie: string | null = null;
    const router = createAppRouter({
      fetchPageTitle: async () => ({ kind: "unavailable" }),
      findBookmarkEditor: async () => null,
      findTagById: async () => null,
      getBookmarkDetail: async () => null,
      getSession: async (headers) => {
        receivedCookie = headers.get("cookie");
        return { email: "koralle@example.com", id: "user-1", name: "koralle" };
      },
      insertBookmark: async () => ({ kind: "duplicate-url" }),
      insertTag: async () => ({ id: 1 as never, kind: "created" }),
      listBookmarks: async () => ({ items: [], nextCursor: null }),
      listShelfTags: async () => [],
      listTags: async () => [],
      softDeleteBookmark: async () => ({ id: "", kind: "bookmark-not-found" }),
      touchTag: async () => ({ kind: "touched" }),
      updateBookmark: async () => ({ kind: "bookmark-not-found" }),
      updateTag: async () => ({ kind: "not-found" }),
    });

    const client = createServerRpcClient(
      () =>
        new Headers({ cookie: "better-auth.session_token=ssr-cookie-value" }),
      router
    );

    await client.auth.session();

    expect(receivedCookie).toBe("better-auth.session_token=ssr-cookie-value");
  }, 30_000);
});
