import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { userIdSchema } from "../../../../domain/user-id";
import {
  seedBookmark,
  seedUser,
  selectBookmarkRow,
  withTestDb,
} from "../../../../test/db/migrated-db";
import type { SoftDeleteBookmarkInput } from "../../application/delete-bookmark";
import { softDeleteBookmark } from "./index";

const testDb = withTestDb();

const bookmarkId = "019fae92-3bb0-78cd-b488-65ce0e26a001";

function command(userId: string, id: string): SoftDeleteBookmarkInput {
  return { id, userId: v.parse(userIdSchema, userId) };
}

describe(softDeleteBookmark, () => {
  test("所有済み未削除行に deletedAt と updatedAt を設定する", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await seedBookmark(db, { id: bookmarkId, userId: "user-a" });
    const before = await selectBookmarkRow(db, bookmarkId);
    if (before === undefined) {
      throw new Error("seeded bookmark is missing");
    }

    const result = await softDeleteBookmark(db, command("user-a", bookmarkId));

    expect(result).toStrictEqual({ id: bookmarkId, kind: "deleted" });
    const row = await selectBookmarkRow(db, bookmarkId);
    expect(row?.deletedAt).not.toBeNull();
    expect(row?.updatedAt.getTime()).toBeGreaterThan(
      before.updatedAt.getTime()
    );
  });

  test("別ユーザーの行は削除せず bookmark-not-found を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");
    await seedBookmark(db, { id: bookmarkId, userId: "user-a" });

    const result = await softDeleteBookmark(db, command("user-b", bookmarkId));

    expect(result).toStrictEqual({ kind: "bookmark-not-found" });
    const row = await selectBookmarkRow(db, bookmarkId);
    expect(row?.deletedAt).toBeNull();
  });

  test("削除済みの行は更新せず bookmark-not-found を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    const deletedAt = new Date("2026-08-05T00:00:00.000Z");
    await seedBookmark(db, {
      deletedAt,
      id: bookmarkId,
      userId: "user-a",
    });
    const before = await selectBookmarkRow(db, bookmarkId);

    const result = await softDeleteBookmark(db, command("user-a", bookmarkId));

    expect(result).toStrictEqual({ kind: "bookmark-not-found" });
    const after = await selectBookmarkRow(db, bookmarkId);
    expect(after?.deletedAt?.getTime()).toBe(deletedAt.getTime());
    expect(after?.updatedAt.getTime()).toBe(before?.updatedAt.getTime());
  });

  test("存在しない id は bookmark-not-found を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");

    const result = await softDeleteBookmark(db, command("user-a", bookmarkId));

    expect(result).toStrictEqual({ kind: "bookmark-not-found" });
  });
});
