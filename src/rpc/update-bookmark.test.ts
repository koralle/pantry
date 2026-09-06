import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import * as v from "valibot";
import { describe, expect, expectTypeOf, test, vi } from "vitest";

import type { UserId, SessionUser } from "../features/auth/domain/auth-values";
import type { UpdateBookmark } from "../features/bookmarks/application/update-bookmark";
import { bookmarkIdSchema } from "../features/bookmarks/domain/bookmark-values";
import type { AppRouter } from "./create-app-router";
import { createAppRouter } from "./create-app-router";
import { handleRpcRequest } from "./handle-request.server";

const userId = "user-1";
const bookmarkId = v.parse(
  bookmarkIdSchema,
  "019fae92-3bb0-78cd-b488-65ce0e26a939"
);

function validUpdateInput() {
  return {
    id: bookmarkId,
    note: null,
    tags: [1],
    title: "Updated Title",
    url: "https://example.com/updated",
  };
}

function updatedPortOutput() {
  return { id: bookmarkId, kind: "updated" } as const;
}

type GetSessionFn = (headers: Headers) => Promise<SessionUser | null>;
type FindBookmarkEditorFn = (
  userId: UserId,
  id: string
) => Promise<{
  id: string;
  url: string;
  title: string;
  note: string | null;
  tagIds: number[];
} | null>;

function authenticatedRouter(overrides?: {
  updateBookmark?: UpdateBookmark;
  findBookmarkEditor?: FindBookmarkEditorFn;
  getSession?: GetSessionFn;
}) {
  const getSession =
    overrides?.getSession ??
    (async (): Promise<SessionUser | null> => ({
      email: `${userId}@example.com`,
      id: userId,
      name: "koralle",
    }));
  const updateBookmark =
    overrides?.updateBookmark ??
    ((async () => updatedPortOutput()) satisfies UpdateBookmark);
  const findBookmarkEditor: FindBookmarkEditorFn =
    overrides?.findBookmarkEditor ??
    (async () => ({
      id: bookmarkId,
      note: null,
      tagIds: [1],
      title: "Article",
      url: "https://example.com/article",
    }));
  return createAppRouter({
    fetchPageTitle: async () => ({ kind: "unavailable" }),
    findBookmarkEditor,
    findTagById: async () => null,
    getBookmarkDetail: async (): Promise<null> => null,
    getSession,
    insertBookmark: async () => ({ kind: "duplicate-url" }),
    insertTag: async () => ({ id: 1 as never, kind: "created" }),
    listBookmarks: async () => ({ items: [], nextCursor: null }),
    listShelfTags: async () => [],
    listTags: async () => [],
    softDeleteBookmark: async () =>
      ({ id: "", kind: "bookmark-not-found" }) as const,
    touchTag: async () => ({ kind: "touched" }),
    updateBookmark,
    updateTag: async () => ({ kind: "not-found" }),
  });
}

/**
 * 本物の RPCLink を、process 内の handleRpcRequest へ繋ぐ。
 * HTTP サーバーや Turso を立てず、クライアント契約とステータスだけを見るため。
 */
function createTestClient(router: AppRouter, headers?: HeadersInit) {
  let lastResponse: Response | undefined;
  const link = new RPCLink({
    fetch: async (request) => {
      const response = await handleRpcRequest(request, router);
      lastResponse = response;
      return response.clone();
    },
    headers: () => new Headers(headers),
    url: "https://pantry.test/api/rpc",
  });
  const client: RouterClient<AppRouter> = createORPCClient(link);
  return {
    client,
    getResponse: () => {
      if (lastResponse === undefined) {
        throw new Error("RPC client did not perform a request");
      }
      return lastResponse;
    },
  };
}

describe("UpdateBookmark RPC", () => {
  test("update の戻り値 id は BookmarkId ではなく string である", () => {
    type UpdateOutput = Awaited<
      ReturnType<RouterClient<AppRouter>["bookmarks"]["update"]>
    >;

    expectTypeOf<UpdateOutput["id"]>().toEqualTypeOf<string>();
    expectTypeOf<UpdateOutput["id"]>().not.toEqualTypeOf<typeof bookmarkId>();
  });

  test("不正な入力は 400 BAD_REQUEST を返し、port を呼ばない", async () => {
    const updateBookmark = vi.fn<UpdateBookmark>(async () =>
      updatedPortOutput()
    );
    const router = authenticatedRouter({ updateBookmark });
    const { client, getResponse } = createTestClient(router);

    const rejected = await client.bookmarks
      .update({ ...validUpdateInput(), title: "" })
      .then(
        () => null,
        (error: unknown) => error
      );

    expect(getResponse().status).toBe(400);
    expect(rejected).toBeInstanceOf(ORPCError);
    expect((rejected as ORPCError<string, unknown>).code).toBe("BAD_REQUEST");
    expect(updateBookmark).not.toHaveBeenCalled();
  });

  test("未認証の update は 401 UNAUTHORIZED を返す", async () => {
    const router = authenticatedRouter({
      getSession: vi.fn(async () => null),
    });
    const { client, getResponse } = createTestClient(router);

    const rejected = await client.bookmarks.update(validUpdateInput()).then(
      () => null,
      (error: unknown) => error
    );

    expect(getResponse().status).toBe(401);
    expect(rejected).toBeInstanceOf(ORPCError);
    expect((rejected as ORPCError<string, unknown>).code).toBe("UNAUTHORIZED");
  });

  test("Cookie ヘッダーが認証 middleware に届く", async () => {
    const getSession = vi.fn(async (headers: Headers) => {
      expect(headers.get("cookie")).toBe("better-auth.session_token=abc");
      return {
        email: `${userId}@example.com`,
        id: userId,
        name: "koralle",
      };
    });
    const router = authenticatedRouter({ getSession });
    const { client } = createTestClient(router, {
      cookie: "better-auth.session_token=abc",
    });

    await client.bookmarks.update(validUpdateInput());

    expect(getSession).toHaveBeenCalledOnce();
  });

  test("URL 重複は 409 duplicate-url を返す", async () => {
    const updateBookmark = vi.fn<UpdateBookmark>(async () => ({
      kind: "duplicate-url",
    }));
    const router = authenticatedRouter({ updateBookmark });
    const { client, getResponse } = createTestClient(router);

    const rejected = await client.bookmarks.update(validUpdateInput()).then(
      () => null,
      (error: unknown) => error
    );

    expect(getResponse().status).toBe(409);
    expect(rejected).toBeInstanceOf(ORPCError);
    expect((rejected as ORPCError<string, unknown>).code).toBe("duplicate-url");
  });

  test("tag 集合の不備は 409 invalid-tag を返す", async () => {
    const updateBookmark = vi.fn<UpdateBookmark>(async () => ({
      kind: "invalid-tag",
    }));
    const router = authenticatedRouter({ updateBookmark });
    const { client, getResponse } = createTestClient(router);

    const rejected = await client.bookmarks.update(validUpdateInput()).then(
      () => null,
      (error: unknown) => error
    );

    expect(getResponse().status).toBe(409);
    expect(rejected).toBeInstanceOf(ORPCError);
    expect((rejected as ORPCError<string, unknown>).code).toBe("invalid-tag");
  });

  test("対象なしは 404 bookmark-not-found を返す", async () => {
    const updateBookmark = vi.fn<UpdateBookmark>(async () => ({
      kind: "bookmark-not-found",
    }));
    const router = authenticatedRouter({ updateBookmark });
    const { client, getResponse } = createTestClient(router);

    const rejected = await client.bookmarks.update(validUpdateInput()).then(
      () => null,
      (error: unknown) => error
    );

    expect(getResponse().status).toBe(404);
    expect(rejected).toBeInstanceOf(ORPCError);
    expect((rejected as ORPCError<string, unknown>).code).toBe(
      "bookmark-not-found"
    );
  });

  test("想定外の例外は内部 message を漏らさず 500 を返す", async () => {
    const updateBookmark = vi.fn<UpdateBookmark>(async () => {
      throw new Error("disk exploded");
    });
    const router = authenticatedRouter({ updateBookmark });
    const { client, getResponse } = createTestClient(router);

    await expect(
      client.bookmarks.update(validUpdateInput())
    ).rejects.toBeInstanceOf(Error);

    expect(getResponse().status).toBe(500);
    await expect(getResponse().text()).resolves.not.toContain("disk exploded");
  });

  test("成功時は plain string の id を返す", async () => {
    const router = authenticatedRouter();
    const { client } = createTestClient(router);

    await expect(
      client.bookmarks.update(validUpdateInput())
    ).resolves.toStrictEqual({
      id: bookmarkId,
    });
  });

  test("Application へ actor 付き command が渡る", async () => {
    const updateBookmark = vi.fn<UpdateBookmark>(async () =>
      updatedPortOutput()
    );
    const router = authenticatedRouter({ updateBookmark });
    const { client } = createTestClient(router);

    await client.bookmarks.update(validUpdateInput());

    expect(updateBookmark).toHaveBeenCalledWith({
      bookmarkId,
      note: null,
      tagIds: [1],
      title: "Updated Title",
      url: "https://example.com/updated",
      userId: userId as UserId,
    });
  });
});

describe("BookmarkEditor read RPC", () => {
  test("editor の出力 id は string、tagIds は number 配列である", () => {
    type EditorOutput = Awaited<
      ReturnType<RouterClient<AppRouter>["bookmarks"]["editor"]>
    >;

    expectTypeOf<EditorOutput["id"]>().toEqualTypeOf<string>();
    expectTypeOf<EditorOutput["tagIds"]>().toEqualTypeOf<number[]>();
  });

  test("編集データを返し、Cookie ヘッダーが認証に使われる", async () => {
    const getSession = vi.fn(async (headers: Headers) => {
      expect(headers.get("cookie")).toBe("better-auth.session_token=abc");
      return {
        email: `${userId}@example.com`,
        id: userId,
        name: "koralle",
      };
    });
    const router = authenticatedRouter({ getSession });
    const { client } = createTestClient(router, {
      cookie: "better-auth.session_token=abc",
    });

    await expect(
      client.bookmarks.editor({ id: bookmarkId })
    ).resolves.toStrictEqual({
      id: bookmarkId,
      note: null,
      tagIds: [1],
      title: "Article",
      url: "https://example.com/article",
    });
    expect(getSession).toHaveBeenCalledOnce();
  });

  test("対象なしの editor は 404 bookmark-not-found を返す", async () => {
    const router = authenticatedRouter({
      findBookmarkEditor: vi.fn(async () => null),
    });
    const { client, getResponse } = createTestClient(router);

    const rejected = await client.bookmarks.editor({ id: bookmarkId }).then(
      () => null,
      (error: unknown) => error
    );

    expect(getResponse().status).toBe(404);
    expect(rejected).toBeInstanceOf(ORPCError);
    expect((rejected as ORPCError<string, unknown>).code).toBe(
      "bookmark-not-found"
    );
  });

  test("未認証の editor は 401 UNAUTHORIZED を返す", async () => {
    const router = authenticatedRouter({
      getSession: vi.fn(async () => null),
    });
    const { client, getResponse } = createTestClient(router);

    const rejected = await client.bookmarks.editor({ id: bookmarkId }).then(
      () => null,
      (error: unknown) => error
    );

    expect(getResponse().status).toBe(401);
    expect((rejected as ORPCError<string, unknown>).code).toBe("UNAUTHORIZED");
  });
});
