import {
  tagIdSchema,
  toTagName,
} from "@pantry/api-contract/schemas/tag-values";
import { tagsTable } from "@pantry/db/schema/tag";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { selectShelfTags } from "../../features/tags/persistence/select-shelf-tags";
import { selectTagById } from "../../features/tags/persistence/select-tag-by-id";
import { selectTags } from "../../features/tags/persistence/select-tags";
import { touchTag } from "../../features/tags/persistence/touch-tag";
import { updateTag } from "../../features/tags/persistence/update-tag";
import {
  bookmarkId,
  seedBookmark,
  seedTag,
  seedUser,
  withPersistenceDb,
} from "./migrated-db";

const actor = "user-a";
const other = "user-b";
const ownBookmarkId = bookmarkId(1);
const otherBookmarkId = bookmarkId(2);

describe("tag ownership on migrated libSQL", () => {
  const persistence = withPersistenceDb();

  test("他ユーザーの tag は取得・更新・touch できない", async () => {
    const db = persistence.getDb();
    const actorId = await seedUser(db, actor);
    await seedUser(db, other);
    const foreignTagId = await seedTag(db, { name: "secret", userId: other });

    const selected = await selectTagById(db, actorId, foreignTagId);
    const updated = await updateTag(db, {
      color: null,
      id: v.parse(tagIdSchema, foreignTagId),
      name: toTagName("stolen"),
      pinned: false,
      sortOrder: 0,
      userId: actorId,
    });
    const touched = await touchTag(db, {
      id: v.parse(tagIdSchema, foreignTagId),
      userId: actorId,
    });
    const [foreignTag] = await db
      .select({ lastUsedAt: tagsTable.lastUsedAt, name: tagsTable.name })
      .from(tagsTable)
      .where(eq(tagsTable.id, foreignTagId));

    expect(selected).toBeNull();
    expect(updated).toStrictEqual({ kind: "not-found" });
    expect(touched).toStrictEqual({ kind: "not-found" });
    expect(foreignTag).toStrictEqual({ lastUsedAt: null, name: "secret" });
  });

  test("棚の集計は他ユーザーの tag / bookmark を混ぜない", async () => {
    const db = persistence.getDb();
    const actorId = await seedUser(db, actor);
    await seedUser(db, other);
    const workId = await seedTag(db, { name: "work", userId: actor });
    const secretId = await seedTag(db, { name: "secret", userId: other });
    await seedBookmark(db, {
      id: ownBookmarkId,
      tagIds: [workId],
      userId: actor,
    });
    await seedBookmark(db, {
      id: otherBookmarkId,
      tagIds: [secretId],
      userId: other,
    });
    await seedBookmark(db, {
      id: bookmarkId(3),
      tagIds: [workId],
      userId: other,
    });

    const shelf = await selectShelfTags(db, actorId);

    expect(
      shelf.map((tag) => ({
        bookmarkCount: tag.bookmarkCount,
        id: tag.id,
        name: tag.name,
      }))
    ).toStrictEqual([{ bookmarkCount: 1, id: workId, name: "work" }]);
  });

  test("selectTags は他ユーザーの tag を返さない", async () => {
    const db = persistence.getDb();
    const actorId = await seedUser(db, actor);
    await seedUser(db, other);
    const workId = await seedTag(db, { name: "work", userId: actor });
    await seedTag(db, { name: "secret", userId: other });

    const rows = await selectTags(db, actorId, { limit: 1000, offset: 0 });

    expect(rows).toStrictEqual([{ id: workId, name: "work" }]);
  });
});
