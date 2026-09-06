import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { user } from "../../db/schema/auth-schema";
import { bookmarkTable } from "../../db/schema/bookmark";
import { tagsTable } from "../../db/schema/tag";
import { userIdSchema } from "../../features/auth/domain/auth-values";
import { decodeBookmarkListCursor } from "../../features/bookmarks/lib/bookmark-list-cursor";
import { BOOKMARK_LIST_PAGE_SIZE } from "../../features/bookmarks/lib/bookmark-list-page-size";
import type { BookmarkListQuery } from "../../features/bookmarks/persistence/list-bookmarks";
import { listBookmarks } from "../../features/bookmarks/persistence/list-bookmarks";
import {
  bookmarkId,
  seedBookmark,
  seedBookmarks,
  seedTag,
  seedUser,
  withPersistenceDb,
} from "./migrated-db";

const base = new Date("2026-08-01T00:00:00.000Z");

function query(
  userId: string,
  overrides: Partial<BookmarkListQuery> = {}
): Parameters<typeof listBookmarks>[1] {
  return {
    sort: "newest",
    tagMode: "and",
    userId: v.parse(userIdSchema, userId),
    ...overrides,
  };
}

describe("listBookmarks on migrated libSQL", () => {
  const persistence = withPersistenceDb();

  test("21件以上あるとき初回は先頭20件と nextCursor を返し、続きは欠落・重複しない", async () => {
    const db = persistence.getDb();
    await seedUser(db, "user-a");
    const count = BOOKMARK_LIST_PAGE_SIZE + 5;
    await seedBookmarks(
      db,
      Array.from({ length: count }, (_, index) => {
        const id = bookmarkId(index);
        return {
          createdAt: new Date(base.getTime() + index * 1000),
          id,
          updatedAt: new Date(base.getTime() + index * 1000),
          userId: "user-a",
        };
      })
    );

    const first = await listBookmarks(db, query("user-a"));
    const second = await listBookmarks(
      db,
      query(
        "user-a",
        first.nextCursor === null ? {} : { cursor: first.nextCursor }
      )
    );
    const allIds = [...first.items, ...second.items].map((item) => item.id);
    const expected = Array.from({ length: count }, (_, index) =>
      bookmarkId(index)
    ).toReversed();

    expect(first.items).toHaveLength(BOOKMARK_LIST_PAGE_SIZE);
    expect(first.nextCursor).not.toBeNull();
    expect(allIds).toStrictEqual(expected);
    expect(new Set(allIds).size).toBe(count);
    expect(second.nextCursor).toBeNull();
  });

  test("同一 createdAt でも id の補助並びでページ境界の欠落・重複がない", async () => {
    const db = persistence.getDb();
    await seedUser(db, "user-a");
    const ids = Array.from(
      { length: BOOKMARK_LIST_PAGE_SIZE + 3 },
      (_, index) => bookmarkId(index)
    );
    await seedBookmarks(
      db,
      ids.map((id) => ({
        createdAt: base,
        id,
        updatedAt: base,
        userId: "user-a",
      }))
    );

    const first = await listBookmarks(db, query("user-a"));
    const second = await listBookmarks(
      db,
      query(
        "user-a",
        first.nextCursor === null ? {} : { cursor: first.nextCursor }
      )
    );
    const allIds = [...first.items, ...second.items].map((item) => item.id);

    expect(allIds).toStrictEqual([...ids].toReversed());
    expect(new Set(allIds).size).toBe(ids.length);
    expect(decodeBookmarkListCursor(first.nextCursor ?? "")?.id).toBe(
      first.items.at(-1)?.id
    );
  });

  test("タグ AND は全て持つブックマークだけ、OR はどれかを含む", async () => {
    const db = persistence.getDb();
    await seedUser(db, "user-a");
    const readingId = await seedTag(db, { name: "reading", userId: "user-a" });
    const workId = await seedTag(db, { name: "work", userId: "user-a" });
    await seedBookmark(db, {
      id: bookmarkId(1),
      tagIds: [readingId, workId],
      title: "両方",
      userId: "user-a",
    });
    await seedBookmark(db, {
      id: bookmarkId(2),
      tagIds: [readingId],
      title: "readingのみ",
      userId: "user-a",
    });

    const andResult = await listBookmarks(
      db,
      query("user-a", { tagMode: "and", tagNames: ["reading", "work"] })
    );
    const orResult = await listBookmarks(
      db,
      query("user-a", { tagMode: "or", tagNames: ["reading", "work"] })
    );

    expect(andResult.items.map((item) => item.id)).toStrictEqual([
      bookmarkId(1),
    ]);
    expect(orResult.items.map((item) => item.id)).toStrictEqual([
      bookmarkId(2),
      bookmarkId(1),
    ]);
  });

  test("q の % はワイルドカードではなくリテラルとして一致させる", async () => {
    const db = persistence.getDb();
    await seedUser(db, "user-a");
    await seedBookmark(db, {
      id: bookmarkId(1),
      title: "50%off",
      userId: "user-a",
    });
    await seedBookmark(db, {
      id: bookmarkId(2),
      title: "50Xoff",
      userId: "user-a",
    });

    const page = await listBookmarks(db, query("user-a", { q: "50%" }));

    expect(page.items.map((item) => item.id)).toStrictEqual([bookmarkId(1)]);
  });

  test("q の _ はワイルドカードではなくリテラルとして一致させる", async () => {
    const db = persistence.getDb();
    await seedUser(db, "user-a");
    await seedBookmark(db, {
      id: bookmarkId(1),
      title: "50_off",
      userId: "user-a",
    });
    await seedBookmark(db, {
      id: bookmarkId(2),
      title: "50Xoff",
      userId: "user-a",
    });

    const page = await listBookmarks(db, query("user-a", { q: "50_" }));

    expect(page.items.map((item) => item.id)).toStrictEqual([bookmarkId(1)]);
  });

  test("削除済みと他人のブックマークは返さない", async () => {
    const db = persistence.getDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");
    await seedBookmark(db, {
      deletedAt: base,
      id: bookmarkId(1),
      title: "消済み",
      userId: "user-a",
    });
    await seedBookmark(db, {
      id: bookmarkId(2),
      title: "他人",
      userId: "user-b",
    });
    await seedBookmark(db, {
      id: bookmarkId(3),
      title: "自分",
      userId: "user-a",
    });

    const page = await listBookmarks(db, query("user-a"));

    expect(page.items.map((item) => item.id)).toStrictEqual([bookmarkId(3)]);
  });

  test("reset 後は前テストの行に依存せず空から始まる", async () => {
    const db = persistence.getDb();
    const leftoverUsers = await db.select({ id: user.id }).from(user);
    const leftoverBookmarks = await db
      .select({ id: bookmarkTable.id })
      .from(bookmarkTable);
    const leftoverTags = await db.select({ id: tagsTable.id }).from(tagsTable);

    expect(leftoverUsers).toStrictEqual([]);
    expect(leftoverBookmarks).toStrictEqual([]);
    expect(leftoverTags).toStrictEqual([]);
  });
});
