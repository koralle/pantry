import { eq, sql } from "drizzle-orm";
import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { bookmarkTable } from "../../db/schema/bookmark";
import { bookmarkTagsTable } from "../../db/schema/bookmark-tag";
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema,
} from "../../features/bookmarks/domain/bookmark-values";
import { insertBookmark } from "../../features/bookmarks/persistence/insert-bookmark";
import { updateBookmark } from "../../features/bookmarks/persistence/update-bookmark";
import { tagIdSchema } from "../../features/tags/domain/tag-values";
import {
  bookmarkId,
  seedBookmark,
  seedTag,
  seedUser,
  withPersistenceDb,
} from "./migrated-db";

describe("DB transaction integrity on migrated libSQL", () => {
  const persistence = withPersistenceDb();

  test("insert 中の未知障害は throw され、bookmark も tag 紐付けも残らない", async () => {
    const db = persistence.getDb();
    const actorId = await seedUser(db, "user-a");
    const workTagId = await seedTag(db, { name: "Work", userId: "user-a" });
    await db.run(sql`
      CREATE TRIGGER block_bookmark_tags
      BEFORE INSERT ON bookmark_tags
      BEGIN
        SELECT RAISE(ABORT, 'blocked');
      END
    `);

    try {
      await expect(
        insertBookmark(db, {
          note: v.parse(bookmarkNoteSchema, null),
          tagIds: [v.parse(tagIdSchema, workTagId)],
          title: v.parse(bookmarkTitleSchema, "Example Article"),
          url: v.parse(bookmarkUrlSchema, "https://example.com/article"),
          userId: actorId,
        })
      ).rejects.toThrow();

      await expect(db.select().from(bookmarkTable)).resolves.toStrictEqual([]);
      await expect(db.select().from(bookmarkTagsTable)).resolves.toStrictEqual(
        []
      );
    } finally {
      await db.run(sql`DROP TRIGGER IF EXISTS block_bookmark_tags`);
    }
  });

  test("update の tag 所有検証失敗では既存の紐付けを残す", async () => {
    const db = persistence.getDb();
    const actorId = await seedUser(db, "user-a");
    await seedUser(db, "user-b");
    const ownTag = await seedTag(db, { name: "own", userId: "user-a" });
    const foreignTag = await seedTag(db, { name: "foreign", userId: "user-b" });
    const targetId = bookmarkId(1);
    await seedBookmark(db, {
      id: targetId,
      tagIds: [ownTag],
      url: "https://example.com/old",
      userId: "user-a",
    });

    const result = await updateBookmark(db, {
      bookmarkId: v.parse(bookmarkIdSchema, targetId),
      note: v.parse(bookmarkNoteSchema, null),
      tagIds: [v.parse(tagIdSchema, foreignTag)],
      title: v.parse(bookmarkTitleSchema, "New"),
      url: v.parse(bookmarkUrlSchema, "https://example.com/new"),
      userId: actorId,
    });
    const [row] = await db
      .select({ url: bookmarkTable.url })
      .from(bookmarkTable)
      .where(eq(bookmarkTable.id, targetId));
    const relations = await db
      .select({ tagId: bookmarkTagsTable.tagId })
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmarkId, targetId));

    expect(result).toStrictEqual({ kind: "invalid-tag" });
    expect(row?.url).toBe("https://example.com/old");
    expect(relations).toStrictEqual([{ tagId: ownTag }]);
  });
});
