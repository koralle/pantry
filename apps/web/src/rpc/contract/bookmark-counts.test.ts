import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { describe, expect, test, vi } from "vitest";

import type {
  SessionUser,
  UserId,
} from "../../features/auth/domain/auth-values";
import type { InsertBookmarkOutput } from "../../features/bookmarks/application/create-bookmark";
import type { UpdateBookmarkOutput } from "../../features/bookmarks/application/update-bookmark";
import type { BookmarkCountView } from "../../features/bookmarks/persistence/get-bookmark-count";
import { handleRpcRequest } from "../server/handle-request.server";
import { createAppRouter } from "./create-app-router";
import type { AppRouter } from "./create-app-router";
import { stubAppRouterDeps } from "./test-deps";

const userId = "user-1";

const sessionUser: SessionUser = {
  email: "koralle@example.com",
  id: userId,
  name: "koralle",
};

type ReadDeps = Parameters<typeof createAppRouter>[0];

function baseDeps(): ReadDeps {
  return {
    ...stubAppRouterDeps(),
    findBookmarkEditor: vi.fn(async () => null),
    getBookmarkDetail: vi.fn(async () => null),
    getBookmarkCount: async () => 0,
    getSession: vi.fn(async () => sessionUser),
    insertBookmark: vi.fn(async (): Promise<InsertBookmarkOutput> => ({
      kind: "duplicate-url",
    })),
    listBookmarks: vi.fn(async () => ({ items: [], nextCursor: null })),
    setBookmarkFavorite: async () => ({ kind: "bookmark-not-found" as const }),
    softDeleteBookmark: vi.fn(
      async (): Promise<{ kind: "bookmark-not-found"; id: string }> => ({
        id: "",
        kind: "bookmark-not-found",
      })
    ),
    updateBookmark: vi.fn(async (): Promise<UpdateBookmarkOutput> => ({
      kind: "bookmark-not-found",
    })),
  };
}

function authenticatedRouter(deps: Partial<ReadDeps> = {}) {
  const merged = { ...baseDeps(), ...deps };
  return createAppRouter(merged);
}

/**
 * 本物の RPCLink を、process 内の handleRpcRequest へ繋ぐ。
 * HTTP サーバーや Turso を立てず、クライアント契約とステータスだけを見るため。
 */
function createTestClient(router: AppRouter, headers?: HeadersInit) {
  let lastResponse: Response | undefined;
  let lastBodyText: string | undefined;
  const link = new RPCLink({
    fetch: async (request) => {
      lastResponse = await handleRpcRequest(request, router);
      lastBodyText = await lastResponse.clone().text();
      return lastResponse;
    },
    headers: () => new Headers(headers),
    url: "https://pantry.test/api/rpc",
  });
  const client: RouterClient<AppRouter> = createORPCClient(link);
  return {
    client,
    getBodyText: async () => {
      if (lastResponse === undefined) {
        throw new Error("RPC client did not perform a request");
      }
      return lastBodyText ?? "";
    },
    getResponse: () => {
      if (lastResponse === undefined) {
        throw new Error("RPC client did not perform a request");
      }
      return lastResponse;
    },
  };
}

describe("bookmarks.counts RPC", () => {
  test("view ごとに独立した procedure が、対応する view の件数を返す", async () => {
    const counts: Record<BookmarkCountView, number> = {
      favorites: 6,
      inbox: 3,
      recent: 128,
    };
    const getBookmarkCount = vi.fn(
      async (_userId: UserId, view: BookmarkCountView) => counts[view]
    );
    const { client } = createTestClient(
      authenticatedRouter({ getBookmarkCount })
    );

    await expect(client.bookmarks.counts.recent()).resolves.toBe(128);
    await expect(client.bookmarks.counts.inbox()).resolves.toBe(3);
    await expect(client.bookmarks.counts.favorites()).resolves.toBe(6);

    expect(getBookmarkCount).toHaveBeenNthCalledWith(1, userId, "recent");
    expect(getBookmarkCount).toHaveBeenNthCalledWith(2, userId, "inbox");
    expect(getBookmarkCount).toHaveBeenNthCalledWith(3, userId, "favorites");
  });
});
