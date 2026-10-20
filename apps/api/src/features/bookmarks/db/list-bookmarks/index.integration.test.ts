import { decodeBookmarkListCursor } from "@pantry/api-contract/schemas/bookmark-list-cursor";
import type { AppDb } from "@pantry/db";
import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { userIdSchema } from "../../../../domain/user-id";
import {
  attachTag,
  bookmarkId,
  seedBookmark,
  seedTag,
  seedUser,
  withTestDb,
} from "../../../../test/db/migrated-db";
import { BOOKMARK_LIST_PAGE_SIZE } from "../../lib/bookmark-list-page-size";
import type { BookmarkListQuery } from "./index";
import { listBookmarks } from "./index";

const testDb = withTestDb();

function query(
  userId: string,
  overrides: Partial<BookmarkListQuery> = {}
): Parameters<typeof listBookmarks>[1] {
  return {
    userId: v.parse(userIdSchema, userId),
    ...overrides,
  };
}

const base = new Date("2026-08-01T00:00:00.000Z");
const newer = new Date("2026-08-10T00:00:00.000Z");

describe(listBookmarks, () => {
  test("自分の未削除ブックマークを新着順とタグ付きで返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    const readingId = await seedTag(db, {
      name: "reading",
      userId: "user-a",
    });
    await seedBookmark(db, {
      createdAt: base,
      id: "b-old",
      title: "古い",
      updatedAt: base,
      userId: "user-a",
    });
    await seedBookmark(db, {
      createdAt: newer,
      id: "b-new",
      title: "新しい",
      updatedAt: base,
      userId: "user-a",
    });
    await attachTag(db, "b-new", readingId);

    const page = await listBookmarks(db, query("user-a"));

    expect(page.items.map((item) => item.id)).toStrictEqual(["b-new", "b-old"]);
    expect(page.nextCursor).toBeNull();
    expect(page.items[0]).toStrictEqual({
      createdAt: new Date("2026-08-10T00:00:00.000Z").toISOString(),
      favorite: false,
      id: "b-new",
      note: null,
      tags: [{ color: null, id: readingId, name: "reading" }],
      title: "新しい",
      updatedAt: new Date("2026-08-01T00:00:00.000Z").toISOString(),
      url: "https://example.com/b-new",
    });
    expect(page.items[1]?.tags).toStrictEqual([]);
  });

  test("削除済みと他人のブックマークは返さない", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");
    await seedBookmark(db, {
      deletedAt: base,
      id: "b-deleted",
      title: "消済み",
      userId: "user-a",
    });
    await seedBookmark(db, {
      id: "b-other",
      title: "他人",
      userId: "user-b",
    });

    const page = await listBookmarks(db, query("user-a"));

    expect(page.items.map((item) => item.id)).toStrictEqual([]);
    expect(page.nextCursor).toBeNull();
  });

  test("タグは全て持つブックマークだけを返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    const readingId = await seedTag(db, {
      name: "reading",
      userId: "user-a",
    });
    const workId = await seedTag(db, { name: "work", userId: "user-a" });
    await seedBookmark(db, { id: "b-both", title: "両方", userId: "user-a" });
    await seedBookmark(db, {
      id: "b-reading",
      title: "readingのみ",
      userId: "user-a",
    });
    await attachTag(db, "b-both", readingId);
    await attachTag(db, "b-both", workId);
    await attachTag(db, "b-reading", readingId);

    const result = await listBookmarks(
      db,
      query("user-a", { tagNames: ["reading", "work"] })
    );

    expect(result.items.map((item) => item.id)).toStrictEqual(["b-both"]);
  });

  test("tagNames は正規化して照合する", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    const readingId = await seedTag(db, {
      name: "reading",
      userId: "user-a",
    });
    await seedBookmark(db, {
      id: "b-1",
      title: "前パディング後",
      userId: "user-a",
    });
    await attachTag(db, "b-1", readingId);

    const items = await listBookmarks(
      db,
      query("user-a", { tagNames: ["Reading", "reading"] })
    );

    expect(items.items.map((item) => item.id)).toStrictEqual(["b-1"]);
  });

  test("21件以上あるとき初回は先頭20件と nextCursor を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await insertSequentialBookmarks(db, "user-a", BOOKMARK_LIST_PAGE_SIZE + 1);

    const page = await listBookmarks(db, query("user-a"));

    expect(page.items.map((item) => item.id)).toStrictEqual(
      idsFrom(0, BOOKMARK_LIST_PAGE_SIZE + 1)
        .toReversed()
        .slice(0, BOOKMARK_LIST_PAGE_SIZE)
    );
    expect(page.nextCursor).not.toBeNull();
  });

  test("続きは cursor で取り、offset なしで欠落・重複しない", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await insertSequentialBookmarks(db, "user-a", BOOKMARK_LIST_PAGE_SIZE + 5);

    const first = await listBookmarks(db, query("user-a"));
    const second = await listBookmarks(
      db,
      query(
        "user-a",
        first.nextCursor === null ? {} : { cursor: first.nextCursor }
      )
    );

    const allIds = [...first.items, ...second.items].map((item) => item.id);
    expect(allIds).toStrictEqual(
      idsFrom(0, BOOKMARK_LIST_PAGE_SIZE + 5).toReversed()
    );
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(second.items).toHaveLength(5);
    expect(second.nextCursor).toBeNull();
  });

  test("ちょうど20件のときは nextCursor がなく空の追加取得を要求しない", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await insertSequentialBookmarks(db, "user-a", BOOKMARK_LIST_PAGE_SIZE);

    const page = await listBookmarks(db, query("user-a"));

    expect(page.items).toHaveLength(BOOKMARK_LIST_PAGE_SIZE);
    expect(page.nextCursor).toBeNull();
  });

  test("同一 createdAt でも id の補助並びでページ境界の欠落・重複がない", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    const ids = idsFrom(0, BOOKMARK_LIST_PAGE_SIZE + 3);
    for (const id of ids) {
      await seedBookmark(db, {
        createdAt: base,
        id,
        title: id,
        updatedAt: base,
        userId: "user-a",
      });
    }

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
  });

  test("cursor があっても現在のタグ条件と所有者境界を迂回しない", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");
    const readingId = await seedTag(db, {
      name: "reading",
      userId: "user-a",
    });
    await seedBookmark(db, {
      createdAt: base,
      id: "a-old",
      title: "古い",
      userId: "user-a",
    });
    await seedBookmark(db, {
      createdAt: newer,
      id: "a-tagged",
      title: "tagged",
      userId: "user-a",
    });
    await seedBookmark(db, {
      createdAt: newer,
      id: "b-other",
      title: "他人",
      userId: "user-b",
    });
    await attachTag(db, "a-tagged", readingId);

    const first = await listBookmarks(
      db,
      query("user-a", { tagNames: ["reading"] })
    );
    const leaked = await listBookmarks(
      db,
      query("user-a", {
        cursor: first.nextCursor ?? encodeFromItem("a-old", base),
        tagNames: ["reading"],
      })
    );

    expect(first.items.map((item) => item.id)).toStrictEqual(["a-tagged"]);
    expect(leaked.items.map((item) => item.id)).not.toContain("a-old");
    expect(leaked.items.map((item) => item.id)).not.toContain("b-other");
  });

  test("nextCursor は末尾の位置を表す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await insertSequentialBookmarks(db, "user-a", BOOKMARK_LIST_PAGE_SIZE + 1);

    const page = await listBookmarks(db, query("user-a"));
    const last = page.items.at(-1);
    const decoded = decodeBookmarkListCursor(page.nextCursor ?? "");

    expect(last).toBeDefined();
    expect(decoded?.id).toBe(last?.id);
    expect(decoded?.createdAtMs).toBe(Date.parse(last?.createdAt ?? ""));
  });

  test("projection に不要な列（userId, deletedAt）を載せない", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await seedBookmark(db, { id: "b-1", title: "最小", userId: "user-a" });

    const page = await listBookmarks(db, query("user-a"));
    const [item] = page.items;

    expect(Object.keys(item ?? {})).toStrictEqual([
      "createdAt",
      "favorite",
      "id",
      "note",
      "title",
      "updatedAt",
      "url",
      "tags",
    ]);
  });
});

function idsFrom(start: number, count: number): string[] {
  return Array.from({ length: count }, (_, index) => bookmarkId(start + index));
}

async function insertSequentialBookmarks(
  db: AppDb,
  userId: string,
  count: number
) {
  for (let index = 0; index < count; index += 1) {
    const id = bookmarkId(index);
    await seedBookmark(db, {
      createdAt: new Date(base.getTime() + index * 1000),
      id,
      title: id,
      updatedAt: new Date(base.getTime() + index * 1000),
      userId,
    });
  }
}

function encodeFromItem(id: string, at: Date): string {
  return `${at.getTime()}:${id}`;
}
