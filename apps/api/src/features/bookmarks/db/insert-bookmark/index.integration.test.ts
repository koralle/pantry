import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema,
} from "@pantry/api-contract/schemas/bookmark-values";
import { tagIdSchema } from "@pantry/api-contract/schemas/tag-values";
import { bookmarkTable } from "@pantry/db/schema/bookmark";
import { bookmarkTagsTable } from "@pantry/db/schema/bookmark-tag";
import { tagsTable } from "@pantry/db/schema/tag";
import { sql } from "drizzle-orm";
import * as v from "valibot";
import { describe, expect, test } from "vitest";

import {
  parseUserId,
  seedTag,
  seedUser,
  withTestDb,
} from "../../../../test/db/migrated-db";
import type { InsertBookmarkInput } from "../../application/create-bookmark";
import { insertBookmark } from "./index";

const testDb = withTestDb();

function createCommand(
  userId: string,
  overrides: {
    url?: string;
    title?: string;
    note?: string | null;
    tagIds?: number[];
  } = {}
): InsertBookmarkInput {
  return {
    note: v.parse(bookmarkNoteSchema, overrides.note ?? null),
    tagIds: (overrides.tagIds ?? []).map((id) => v.parse(tagIdSchema, id)),
    title: v.parse(bookmarkTitleSchema, overrides.title ?? "Example Article"),
    url: v.parse(
      bookmarkUrlSchema,
      overrides.url ?? "https://example.com/article"
    ),
    userId: parseUserId(userId),
  };
}

describe(insertBookmark, () => {
  test("ブックマークを作成し UUIDv7 の id を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");

    const output = await insertBookmark(db, createCommand("user-a"));

    expect(output.kind).toBe("created");
    if (output.kind !== "created") {
      return;
    }
    expect(v.parse(bookmarkIdSchema, output.id)).toBeDefined();

    const rows = await db.select().from(bookmarkTable);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: output.id,
      note: null,
      title: "Example Article",
      url: "https://example.com/article",
      userId: parseUserId("user-a"),
    });
  });

  test("同一ユーザーの同一 URL は duplicate-url を返し、行は増えない", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");

    const first = await insertBookmark(
      db,
      createCommand("user-a", { url: "https://example.com/dup" })
    );
    const second = await insertBookmark(
      db,
      createCommand("user-a", { url: "https://example.com/dup" })
    );

    expect(first.kind).toBe("created");
    expect(second).toStrictEqual({ kind: "duplicate-url" });

    const rows = await db.select({ id: bookmarkTable.id }).from(bookmarkTable);
    expect(rows).toHaveLength(1);
  });

  test("別ユーザーなら同じ URL を作成できる", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");

    const first = await insertBookmark(
      db,
      createCommand("user-a", { url: "https://example.com/shared" })
    );
    const second = await insertBookmark(
      db,
      createCommand("user-b", { url: "https://example.com/shared" })
    );

    expect(first.kind).toBe("created");
    expect(second.kind).toBe("created");
  });

  test("所有タグを紐付け、そのタグの lastUsedAt だけを更新する", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-other");
    const workTagId = await seedTag(db, { name: "Work", userId: "user-a" });
    const laterTagId = await seedTag(db, { name: "Later", userId: "user-a" });

    const output = await insertBookmark(
      db,
      createCommand("user-a", { tagIds: [workTagId, laterTagId] })
    );

    expect(output.kind).toBe("created");
    if (output.kind !== "created") {
      return;
    }

    const links = await db.select().from(bookmarkTagsTable);
    expect(links).toStrictEqual([
      { bookmarkId: output.id, tagId: workTagId },
      { bookmarkId: output.id, tagId: laterTagId },
    ]);

    const rows = await db.select().from(tagsTable);
    const byId = new Map(rows.map((row) => [row.id, row]));
    expect(byId.get(workTagId)?.lastUsedAt).not.toBeNull();
    expect(byId.get(laterTagId)?.lastUsedAt).not.toBeNull();
  });

  test("タグなしでは bookmark_tags も lastUsedAt も触れない", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    const workTagId = await seedTag(db, { name: "Work", userId: "user-a" });

    const output = await insertBookmark(db, createCommand("user-a"));

    expect(output.kind).toBe("created");
    await expect(db.select().from(bookmarkTagsTable)).resolves.toHaveLength(0);
    const [tagRow] = await db.select().from(tagsTable);
    expect(tagRow?.id).toBe(workTagId);
    expect(tagRow?.lastUsedAt).toBeNull();
  });

  test("重複した tagIds は 1 行だけ紐付ける", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    const workTagId = await seedTag(db, { name: "Work", userId: "user-a" });

    const output = await insertBookmark(
      db,
      createCommand("user-a", { tagIds: [workTagId, workTagId] })
    );

    expect(output.kind).toBe("created");
    if (output.kind !== "created") {
      return;
    }
    await expect(db.select().from(bookmarkTagsTable)).resolves.toStrictEqual([
      { bookmarkId: output.id, tagId: workTagId },
    ]);
  });

  test("別ユーザーのタグは invalid-tag で、bookmark も書かない", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");
    const foreignTagId = await seedTag(db, {
      name: "Foreign",
      userId: "user-b",
    });

    const output = await insertBookmark(
      db,
      createCommand("user-a", { tagIds: [foreignTagId] })
    );

    expect(output).toStrictEqual({ kind: "invalid-tag" });
    await expect(db.select().from(bookmarkTable)).resolves.toHaveLength(0);
    await expect(db.select().from(bookmarkTagsTable)).resolves.toHaveLength(0);
  });

  test("存在しないタグは invalid-tag で、bookmark も書かない", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");

    const output = await insertBookmark(
      db,
      createCommand("user-a", { tagIds: [v.parse(tagIdSchema, 999)] })
    );

    expect(output).toStrictEqual({ kind: "invalid-tag" });
    await expect(db.select().from(bookmarkTable)).resolves.toHaveLength(0);
  });

  test("transaction 内の未知障害は throw され、部分書き込みが残らない", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    const workTagId = await seedTag(db, { name: "Work", userId: "user-a" });
    await db.run(sql`
      CREATE TRIGGER block_bookmark_tags
      BEFORE INSERT ON bookmark_tags
      BEGIN
        SELECT RAISE(ABORT, 'blocked');
      END;
    `);

    await expect(
      insertBookmark(db, createCommand("user-a", { tagIds: [workTagId] }))
    ).rejects.toThrow();

    await expect(db.select().from(bookmarkTable)).resolves.toHaveLength(0);
    await expect(db.select().from(bookmarkTagsTable)).resolves.toHaveLength(0);
  });
});
