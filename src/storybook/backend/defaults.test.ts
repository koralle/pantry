import * as v from "valibot";
import { afterEach, describe, expect, test, vi } from "vitest";

import { userIdSchema } from "../../features/auth/domain/auth-values";
import type { ShelfTag } from "../../features/tags/lib/tag-shelf";
import { resolveBackend } from "./defaults";

const userId = v.parse(userIdSchema, "user-1");

const shelfTag: ShelfTag = {
  bookmarkCount: 1,
  color: null,
  id: 1,
  lastUsedAt: null,
  name: "story-tag",
  pinned: false,
  sortOrder: 0,
};

describe("resolveBackend", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("既定はシェルが読む port だけを返す", async () => {
    const backend = resolveBackend();

    await expect(backend.getSession(new Headers())).resolves.toEqual({
      email: "koralle@example.com",
      id: "user-1",
      name: "koralle",
    });
    await expect(backend.listShelfTags(userId)).resolves.toEqual([]);
    await expect(backend.getBookmarkCount(userId, "recent")).resolves.toBe(0);
  });

  test("Story の override が既定より優先される", async () => {
    const backend = resolveBackend({
      getBookmarkCount: async () => 7,
      listShelfTags: async () => [shelfTag],
    });

    await expect(backend.listShelfTags(userId)).resolves.toEqual([shelfTag]);
    await expect(backend.getBookmarkCount(userId, "inbox")).resolves.toBe(7);
  });

  test("未宣言の port は port 名をログに出して throw する", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const backend = resolveBackend();

    expect(() => {
      void backend.listBookmarks({ userId });
    }).toThrow("Storybook: port listBookmarks はモックされていない");
    expect(logged).toHaveBeenCalledWith(
      "Storybook: port listBookmarks はモックされていない"
    );
  });
});
