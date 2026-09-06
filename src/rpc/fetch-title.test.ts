import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { describe, expect, test, vi } from "vitest";

import type {
  FetchPageTitle,
  FetchPageTitleOutput,
} from "../features/bookmarks/application/fetch-page-title";
import { createAppRouter } from "./create-app-router";
import type { AppRouter } from "./create-app-router";
import { handleRpcRequest } from "./handle-request.server";

const userId = "user-1";

function authenticatedRouter(
  fetchPageTitle: FetchPageTitle,
  getSession = vi.fn()
) {
  getSession.mockResolvedValue({
    email: `${userId}@example.com`,
    id: userId,
    name: "koralle",
  });
  return createAppRouter({
    fetchPageTitle,
    findBookmarkEditor: async () => null,
    findTagById: async () => null,
    getBookmarkDetail: async () => null,
    getSession,
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
}

function createTestClient(router: AppRouter, headers?: HeadersInit) {
  const link = new RPCLink({
    fetch: async (request) => await handleRpcRequest(request, router),
    headers: () => new Headers(headers),
    url: "https://pantry.test/api/rpc",
  });
  const client: RouterClient<AppRouter> = createORPCClient(link);
  return client;
}

describe("FetchPageTitle RPC", () => {
  test("未認証のリクエストは 401 UNAUTHORIZED を返す", async () => {
    const router = createAppRouter({
      fetchPageTitle: async () => ({ kind: "unavailable" }),
      findBookmarkEditor: async () => null,
      findTagById: async () => null,
      getBookmarkDetail: async () => null,
      getSession: async () => null,
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
    const client = createTestClient(router);
    const rejected = await client.bookmarks
      .title({ url: "https://example.com" })
      .then(
        () => null,
        (error: unknown) => error
      );

    expect(rejected).toBeInstanceOf(ORPCError);
    expect((rejected as ORPCError<string, unknown>).code).toBe("UNAUTHORIZED");
  });

  test("取得できた title を文字列で返す", async () => {
    const router = authenticatedRouter(async () => ({
      kind: "fetched",
      title: "Example",
    }));
    const client = createTestClient(router);

    await expect(
      client.bookmarks.title({ url: "https://example.com" })
    ).resolves.toBe("Example");
  });

  test("title なし・対応外 content type は null 成功を返す", async () => {
    const output: FetchPageTitleOutput = { kind: "unavailable" };
    const router = authenticatedRouter(async () => output);
    const client = createTestClient(router);

    await expect(
      client.bookmarks.title({ url: "https://example.com" })
    ).resolves.toBeNull();
  });

  test("禁止 URL は 400 url-not-allowed を返す", async () => {
    const router = authenticatedRouter(async () => ({
      kind: "url-not-allowed",
    }));
    const client = createTestClient(router);
    const rejected = await client.bookmarks
      .title({ url: "http://localhost" })
      .then(
        () => null,
        (error: unknown) => error
      );

    expect(rejected).toBeInstanceOf(ORPCError);
    const error = rejected as ORPCError<string, unknown>;
    expect(error.code).toBe("url-not-allowed");
    expect(error.status).toBe(400);
  });

  test("想定外の例外は内部 message を漏らさず 500 を返す", async () => {
    const router = authenticatedRouter(async () => {
      throw new Error("proxy secret detail");
    });
    let lastResponse: Response | undefined;
    const link = new RPCLink({
      fetch: async (request) => {
        const response = await handleRpcRequest(request, router);
        lastResponse = response.clone();
        return response;
      },
      headers: () => new Headers(),
      url: "https://pantry.test/api/rpc",
    });
    const client: RouterClient<AppRouter> = createORPCClient(link);

    await expect(
      client.bookmarks.title({ url: "https://example.com" })
    ).rejects.toBeInstanceOf(Error);
    expect(lastResponse?.status).toBe(500);
    await expect(lastResponse?.text()).resolves.not.toContain(
      "proxy secret detail"
    );
  });

  test("不正な URL 入力は 400 BAD_REQUEST を返し、port を呼ばない", async () => {
    const fetchPageTitle = vi.fn(
      async () => ({ kind: "unavailable" }) as const
    );
    const router = authenticatedRouter(fetchPageTitle);
    const client = createTestClient(router);
    const rejected = await client.bookmarks
      .title({ url: "not-a-url" } as any)
      .then(
        () => null,
        (error: unknown) => error
      );

    expect(rejected).toBeInstanceOf(ORPCError);
    expect((rejected as ORPCError<string, unknown>).code).toBe("BAD_REQUEST");
    expect((rejected as ORPCError<string, unknown>).status).toBe(400);
    expect(fetchPageTitle).not.toHaveBeenCalled();
  });
});
