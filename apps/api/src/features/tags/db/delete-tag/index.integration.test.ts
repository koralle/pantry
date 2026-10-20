import { tagIdSchema } from "@pantry/api-contract/schemas/tag-values";
import { bookmarkTable } from "@pantry/db/schema/bookmark";
import { bookmarkTagsTable } from "@pantry/db/schema/bookmark-tag";
import { tagsTable } from "@pantry/db/schema/tag";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { describe, expect, test } from "vitest";

import {
  parseUserId,
  seedBookmark,
  seedTag,
  seedUser,
  withTestDb,
} from "../../../../test/db/migrated-db";
import { deleteTag } from "./index";

const testDb = withTestDb();

const parseTagId = (value: number) => v.parse(tagIdSchema, value);

describe(deleteTag, () => {
  test("本人のタグは紐付けごと消え、ブックマーク本体は残る", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    const tagId = await seedTag(db, { name: "reading", userId: "user-a" });
    await seedBookmark(db, { id: "bm-1", tagIds: [tagId], userId: "user-a" });

    const output = await deleteTag(db, {
      id: parseTagId(tagId),
      userId: parseUserId("user-a"),
    });

    expect(output).toStrictEqual({ kind: "deleted" });
    expect(await db.select().from(tagsTable)).toStrictEqual([]);
    expect(await db.select().from(bookmarkTagsTable)).toStrictEqual([]);
    expect(
      await db.select().from(bookmarkTable).where(eq(bookmarkTable.id, "bm-1"))
    ).toHaveLength(1);
  });

  test("他人のタグは not-found で、タグと紐付けは残る", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");
    const tagId = await seedTag(db, { name: "reading", userId: "user-a" });
    await seedBookmark(db, { id: "bm-1", tagIds: [tagId], userId: "user-a" });

    const output = await deleteTag(db, {
      id: parseTagId(tagId),
      userId: parseUserId("user-b"),
    });

    expect(output).toStrictEqual({ kind: "not-found" });
    expect(await db.select().from(tagsTable)).toHaveLength(1);
    expect(await db.select().from(bookmarkTagsTable)).toHaveLength(1);
  });

  test("存在しない id は not-found", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");

    const output = await deleteTag(db, {
      id: parseTagId(999),
      userId: parseUserId("user-a"),
    });

    expect(output).toStrictEqual({ kind: "not-found" });
  });
});
