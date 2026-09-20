import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { describe, expect, expectTypeOf, test, vi } from "vitest";

import type { DeleteTag } from "../features/tags/application/delete-tag";
import { createAppRouter } from "./create-app-router";
import type { AppRouter } from "./create-app-router";
import { handleRpcRequest } from "./handle-request.server";

const userId = "user-1";

const readDeps = {
  fetchPageTitle: async () => ({ kind: "unavailable" }) as const,
  findBookmarkEditor: async (): Promise<null> => null,
  findTagById: async () => null,
  getBookmarkCounts: async () => ({ favorites: 0, inbox: 0, recent: 0 }),
  getBookmarkDetail: async (): Promise<null> => null,
  insertBookmark: async () => ({ kind: "duplicate-url" }) as const,
  insertTag: async () => ({ kind: "name-conflict" }) as const,
  listBookmarks: async () => ({ items: [], nextCursor: null }),
  listShelfTags: async () => [] as never[],
  listTags: async () => [] as never[],
  setBookmarkFavorite: async () => ({ kind: "bookmark-not-found" as const }),
  softDeleteBookmark: async () =>
    ({ id: "", kind: "bookmark-not-found" }) as const,
  touchTag: async () => ({ kind: "touched" }) as const,
  updateBookmark: async () => ({ kind: "bookmark-not-found" }) as const,
  updateTag: async () => ({ kind: "not-found" }) as const,
};

function authenticatedRouter(deleteTag: DeleteTag, getSession = vi.fn()) {
  getSession.mockResolvedValue({
    email: `${userId}@example.com`,
    id: userId,
    name: "koralle",
  });
  return createAppRouter({
    deleteTag,
    getSession,
    ...readDeps,
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
      lastResponse = await handleRpcRequest(request, router);
      return lastResponse;
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

describe("DeleteTag RPC", () => {
  test("delete の wire 出力は brand を載せない plain な { id: number } である", () => {
    type DeleteOutput = Awaited<
      ReturnType<RouterClient<AppRouter>["tags"]["delete"]>
    >;

    expectTypeOf<DeleteOutput>().toEqualTypeOf<{ id: number }>();
  });

  test("成功時に userId と id が port へ届き、plain number id が返る", async () => {
    const received: { id: number; userId: string }[] = [];
    const router = authenticatedRouter(async (input) => {
      received.push({ id: Number(input.id), userId: input.userId });
      return { kind: "deleted" };
    });
    const { client } = createTestClient(router);

    const output = await client.tags.delete({ id: 7 });

    expect(output).toStrictEqual({ id: 7 });
    expect(received).toStrictEqual([{ id: 7, userId }]);
  });

  test("不正な入力は 400 BAD_REQUEST を返し、port を呼ばない", async () => {
    const deleteTag = vi.fn(async () => ({ kind: "deleted" as const }));
    const router = authenticatedRouter(deleteTag);
    const { client, getResponse } = createTestClient(router);

    const rejected = await client.tags.delete({ id: 0 }).then(
      () => null,
      (error: unknown) => error
    );

    expect(getResponse().status).toBe(400);
    expect(rejected).toBeInstanceOf(ORPCError);
    expect((rejected as ORPCError<string, unknown>).code).toBe("BAD_REQUEST");
    expect(deleteTag).not.toHaveBeenCalled();
  });

  test("未認証のリクエストは 401 UNAUTHORIZED を返す", async () => {
    const router = createAppRouter({
      deleteTag: async () => ({ kind: "deleted" }) as const,
      getSession: async () => null,
      ...readDeps,
    });
    const { client, getResponse } = createTestClient(router);

    const rejected = await client.tags.delete({ id: 1 }).then(
      () => null,
      (error: unknown) => error
    );

    expect(getResponse().status).toBe(401);
    expect(rejected).toBeInstanceOf(ORPCError);
    expect((rejected as ORPCError<string, unknown>).code).toBe("UNAUTHORIZED");
  });

  test("対象なしは defined な 404 tag-not-found を返す", async () => {
    const router = authenticatedRouter(async () => ({ kind: "not-found" }));
    const { client, getResponse } = createTestClient(router);

    const rejected = await client.tags.delete({ id: 9 }).then(
      () => null,
      (error: unknown) => error
    );

    expect(getResponse().status).toBe(404);
    expect(rejected).toBeInstanceOf(ORPCError);
    expect((rejected as ORPCError<string, unknown>).code).toBe("tag-not-found");
  });
});
