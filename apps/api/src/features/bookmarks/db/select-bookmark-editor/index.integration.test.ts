import { bookmarkIdSchema } from "@pantry/api-contract/schemas/bookmark-values";
import * as v from "valibot";
import { describe, expect, test } from "vitest";

import {
  attachTag,
  seedBookmark,
  seedTag,
  seedUser,
  withTestDb,
} from "../../../../test/db/migrated-db";
import { selectBookmarkEditor } from "./index";

const testDb = withTestDb();

const actorId = "user-a";
const targetId = "019fae92-3bb0-78cd-b488-65ce0e26a939";

describe(selectBookmarkEditor, () => {
  test("actor が所有する未削除 bookmark の編集用 projection を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, actorId);
    await seedBookmark(db, {
      id: targetId,
      note: "memo",
      title: "Article",
      url: "https://example.com/article",
      userId: actorId,
    });
    const tag = await seedTag(db, { name: "work", userId: actorId });
    await attachTag(db, targetId, tag);

    const record = await selectBookmarkEditor(
      db,
      v.parse(v.string(), actorId) as never,
      targetId
    );

    expect(record).toStrictEqual({
      id: v.parse(bookmarkIdSchema, targetId),
      note: "memo",
      tagIds: [tag],
      title: "Article",
      url: "https://example.com/article",
    });
  });

  test("対象なしは null を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, actorId);

    await expect(
      selectBookmarkEditor(db, actorId as never, targetId)
    ).resolves.toBeNull();
  });

  test("削除済み bookmark も null を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, actorId);
    await seedBookmark(db, {
      deletedAt: new Date(),
      id: targetId,
      url: "https://example.com/gone",
      userId: actorId,
    });

    await expect(
      selectBookmarkEditor(db, actorId as never, targetId)
    ).resolves.toBeNull();
  });

  test("他ユーザーの tag は tagIds に含めない", async () => {
    const db = testDb.getDb();
    await seedUser(db, actorId);
    await seedUser(db, "user-b");
    await seedBookmark(db, {
      id: targetId,
      title: "Article",
      url: "https://example.com/article",
      userId: actorId,
    });
    const ownTag = await seedTag(db, { name: "work", userId: actorId });
    const foreignTag = await seedTag(db, { name: "secret", userId: "user-b" });
    await attachTag(db, targetId, ownTag);
    await attachTag(db, targetId, foreignTag);

    const record = await selectBookmarkEditor(
      db,
      v.parse(v.string(), actorId) as never,
      targetId
    );

    expect(record?.tagIds).toStrictEqual([ownTag]);
  });

  test("別 user の bookmark も null を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-b");
    await seedBookmark(db, {
      id: targetId,
      url: "https://example.com/theirs",
      userId: "user-b",
    });

    await expect(
      selectBookmarkEditor(db, actorId as never, targetId)
    ).resolves.toBeNull();
  });
});
