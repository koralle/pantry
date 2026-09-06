import * as v from "valibot";
import { afterEach, describe, expect, test } from "vitest";

import { bookmarkIdSchema } from "../domain/bookmark-values";
import { selectBookmarkEditor } from "./select-bookmark-editor";
import {
  closeMemoryClients,
  createMemoryDb,
  insertBookmarkRow,
  insertBookmarkTagRow,
  insertTagRow,
  insertUser,
} from "./test-helpers";

afterEach(async () => {
  await closeMemoryClients();
});

const actorId = "user-a";
const targetId = "019fae92-3bb0-78cd-b488-65ce0e26a939";

describe(selectBookmarkEditor, () => {
  test("actor が所有する未削除 bookmark の編集用 projection を返す", async () => {
    const db = await createMemoryDb();
    await insertUser(db, actorId);
    await insertBookmarkRow(db, {
      id: targetId,
      note: "memo",
      title: "Article",
      url: "https://example.com/article",
      userId: actorId,
    });
    const tag = await insertTagRow(db, actorId, "work");
    await insertBookmarkTagRow(db, targetId, tag);

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
    const db = await createMemoryDb();
    await insertUser(db, actorId);

    await expect(
      selectBookmarkEditor(db, actorId as never, targetId)
    ).resolves.toBeNull();
  });

  test("削除済み bookmark も null を返す", async () => {
    const db = await createMemoryDb();
    await insertUser(db, actorId);
    await insertBookmarkRow(db, {
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
    const db = await createMemoryDb();
    await insertUser(db, actorId);
    await insertUser(db, "user-b");
    await insertBookmarkRow(db, {
      id: targetId,
      title: "Article",
      url: "https://example.com/article",
      userId: actorId,
    });
    const ownTag = await insertTagRow(db, actorId, "work");
    const foreignTag = await insertTagRow(db, "user-b", "secret");
    await insertBookmarkTagRow(db, targetId, ownTag);
    await insertBookmarkTagRow(db, targetId, foreignTag);

    const record = await selectBookmarkEditor(
      db,
      v.parse(v.string(), actorId) as never,
      targetId
    );

    expect(record?.tagIds).toStrictEqual([ownTag]);
  });

  test("別 user の bookmark も null を返す", async () => {
    const db = await createMemoryDb();
    await insertUser(db, "user-b");
    await insertBookmarkRow(db, {
      id: targetId,
      url: "https://example.com/theirs",
      userId: "user-b",
    });

    await expect(
      selectBookmarkEditor(db, actorId as never, targetId)
    ).resolves.toBeNull();
  });
});
