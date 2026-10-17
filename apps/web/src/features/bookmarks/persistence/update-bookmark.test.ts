import { eq } from "drizzle-orm";
import * as v from "valibot";
import { afterEach, describe, expect, test } from "vitest";

import { bookmarkTable } from "../../../db/schema/bookmark";
import { bookmarkTagsTable } from "../../../db/schema/bookmark-tag";
import { tagsTable } from "../../../db/schema/tag";
import type { UserId } from "../../auth/domain/auth-values";
import { tagIdSchema } from "../../tags/domain/tag-values";
import type { UpdateBookmarkInput } from "../application/update-bookmark";
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema,
} from "../domain/bookmark-values";
import {
  closeMemoryClients,
  createMemoryDb,
  insertBookmarkRow,
  insertBookmarkTagRow,
  insertTagRow,
  insertUser,
} from "./test-helpers";
import { updateBookmark } from "./update-bookmark";

afterEach(async () => {
  await closeMemoryClients();
});

const actorId = "user-a";
const otherUserId = "user-b";
const targetId = "019fae92-3bb0-78cd-b488-65ce0e26a939";
const otherBookmarkId = "019fae92-3bb0-78cd-b488-65ce0e26a93a";

function createInput(
  overrides: Partial<{
    userId: UserId;
    bookmarkId: string;
    url: string;
    title: string;
    note: string | null;
    tagIds: number[];
  }> = {}
): UpdateBookmarkInput {
  return {
    bookmarkId: v.parse(bookmarkIdSchema, overrides.bookmarkId ?? targetId),
    note: v.parse(bookmarkNoteSchema, overrides.note ?? null),
    tagIds: (overrides.tagIds ?? []).map((value) =>
      v.parse(tagIdSchema, value)
    ),
    title: v.parse(bookmarkTitleSchema, overrides.title ?? "Updated Title"),
    url: v.parse(
      bookmarkUrlSchema,
      overrides.url ?? "https://example.com/updated"
    ),
    userId: (overrides.userId ?? actorId) as UserId,
  };
}

async function seedBase(): Promise<Awaited<ReturnType<typeof createMemoryDb>>> {
  const db = await createMemoryDb();
  await insertUser(db, actorId);
  await insertUser(db, otherUserId);
  await insertBookmarkRow(db, {
    id: targetId,
    url: "https://example.com/old",
    userId: actorId,
  });
  return db;
}

describe(updateBookmark, () => {
  test("URL と title / note を更新し、bookmark-tag を全置換して tag の lastUsedAt を更新する", async () => {
    const db = await seedBase();
    const oldTag = await insertTagRow(db, actorId, "old");
    const newTag = await insertTagRow(db, actorId, "new");
    await insertBookmarkTagRow(db, targetId, oldTag);

    const result = await updateBookmark(db, createInput({ tagIds: [newTag] }));

    expect(result).toStrictEqual({
      id: v.parse(bookmarkIdSchema, targetId),
      kind: "updated",
    });

    const [row] = await db
      .select({
        note: bookmarkTable.note,
        title: bookmarkTable.title,
        url: bookmarkTable.url,
      })
      .from(bookmarkTable)
      .where(eq(bookmarkTable.id, targetId));
    expect(row).toStrictEqual({
      note: null,
      title: "Updated Title",
      url: "https://example.com/updated",
    });

    const relations = await db
      .select({ tagId: bookmarkTagsTable.tagId })
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmarkId, targetId));
    expect(relations).toStrictEqual([{ tagId: newTag }]);

    const [tagRow] = await db
      .select({ lastUsedAt: tagsTable.lastUsedAt })
      .from(tagsTable)
      .where(eq(tagsTable.id, newTag));
    expect(tagRow?.lastUsedAt).not.toBeNull();

    const [untouchedTag] = await db
      .select({ lastUsedAt: tagsTable.lastUsedAt })
      .from(tagsTable)
      .where(eq(tagsTable.id, oldTag));
    expect(untouchedTag?.lastUsedAt).toBeNull();
  });

  test("同一ユーザーの別 bookmark が同じ URL を持つとき duplicate-url で何も書き換えない", async () => {
    const db = await seedBase();
    await insertBookmarkRow(db, {
      id: otherBookmarkId,
      url: "https://example.com/updated",
      userId: actorId,
    });
    const tag = await insertTagRow(db, actorId, "work");
    await insertBookmarkTagRow(db, targetId, tag);

    const result = await updateBookmark(db, createInput({ tagIds: [tag] }));

    expect(result).toStrictEqual({ kind: "duplicate-url" });

    const [row] = await db
      .select({ url: bookmarkTable.url })
      .from(bookmarkTable)
      .where(eq(bookmarkTable.id, targetId));
    expect(row?.url).toBe("https://example.com/old");

    const relations = await db
      .select({ tagId: bookmarkTagsTable.tagId })
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmarkId, targetId));
    expect(relations).toStrictEqual([{ tagId: tag }]);
  });

  test("対象自身が同じ URL を保つ更新は updated になる", async () => {
    const db = await seedBase();

    const result = await updateBookmark(
      db,
      createInput({ title: "Same Url", url: "https://example.com/old" })
    );

    expect(result.kind).toBe("updated");
  });

  test("存在しない bookmark は bookmark-not-found を返す", async () => {
    const db = await seedBase();

    const result = await updateBookmark(
      db,
      createInput({ bookmarkId: "019fae92-3bb0-78cd-b488-65ce0e26a93b" })
    );

    expect(result).toStrictEqual({ kind: "bookmark-not-found" });
  });

  test("削除済み bookmark は bookmark-not-found を返す", async () => {
    const db = await seedBase();
    await insertBookmarkRow(db, {
      deletedAt: new Date(),
      id: otherBookmarkId,
      url: "https://example.com/deleted",
      userId: actorId,
    });

    const result = await updateBookmark(
      db,
      createInput({ bookmarkId: otherBookmarkId })
    );

    expect(result).toStrictEqual({ kind: "bookmark-not-found" });
  });

  test("別 user の bookmark は bookmark-not-found を返す", async () => {
    const db = await seedBase();
    await insertBookmarkRow(db, {
      id: otherBookmarkId,
      url: "https://example.com/theirs",
      userId: otherUserId,
    });

    const result = await updateBookmark(
      db,
      createInput({ bookmarkId: otherBookmarkId })
    );

    expect(result).toStrictEqual({ kind: "bookmark-not-found" });
  });

  test("別 user の tag への付け替えは invalid-tag で部分書き込みを残さない", async () => {
    const db = await seedBase();
    const foreignTag = await insertTagRow(db, otherUserId, "foreign");
    const ownTag = await insertTagRow(db, actorId, "own");
    await insertBookmarkTagRow(db, targetId, ownTag);

    const result = await updateBookmark(
      db,
      createInput({ tagIds: [foreignTag] })
    );

    expect(result).toStrictEqual({ kind: "invalid-tag" });

    const relations = await db
      .select({ tagId: bookmarkTagsTable.tagId })
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmarkId, targetId));
    expect(relations).toStrictEqual([{ tagId: ownTag }]);

    const [tagRow] = await db
      .select({ lastUsedAt: tagsTable.lastUsedAt })
      .from(tagsTable)
      .where(eq(tagsTable.id, foreignTag));
    expect(tagRow?.lastUsedAt).toBeNull();
  });

  test("存在しない tag は invalid-tag を返す", async () => {
    const db = await seedBase();

    const result = await updateBookmark(db, createInput({ tagIds: [9999] }));

    expect(result).toStrictEqual({ kind: "invalid-tag" });
  });

  test("未知の障害では rollback され部分書き込みが残らない", async () => {
    const db = await seedBase();
    await db.run(`
      CREATE TRIGGER fail_bookmark_update BEFORE UPDATE ON bookmarks
      WHEN NEW.title = 'boom'
      BEGIN
        SELECT RAISE(ABORT, 'boom');
      END
    `);
    const tag = await insertTagRow(db, actorId, "keep");
    await insertBookmarkTagRow(db, targetId, tag);

    await expect(
      updateBookmark(db, createInput({ tagIds: [], title: "boom" }))
    ).rejects.toThrow();

    const [row] = await db
      .select({ url: bookmarkTable.url })
      .from(bookmarkTable)
      .where(eq(bookmarkTable.id, targetId));
    expect(row?.url).toBe("https://example.com/old");

    const relations = await db
      .select({ tagId: bookmarkTagsTable.tagId })
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmarkId, targetId));
    expect(relations).toStrictEqual([{ tagId: tag }]);
  });
});
