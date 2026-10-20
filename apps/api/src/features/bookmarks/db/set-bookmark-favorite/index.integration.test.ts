import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { userIdSchema } from "../../../../domain/user-id";
import {
  seedBookmark,
  seedUser,
  selectBookmarkRow,
  withTestDb,
} from "../../../../test/db/migrated-db";
import type { SetBookmarkFavoriteInput } from "../../application/set-bookmark-favorite";
import { setBookmarkFavorite } from "./index";

const testDb = withTestDb();

const bookmarkId = "019fae92-3bb0-78cd-b488-65ce0e26a001";

function command(
  userId: string,
  id: string,
  favorite: boolean
): SetBookmarkFavoriteInput {
  return { favorite, id, userId: v.parse(userIdSchema, userId) };
}

describe(setBookmarkFavorite, () => {
  test("所有済み未削除行の favorite を立てて updatedAt を進める", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await seedBookmark(db, { id: bookmarkId, userId: "user-a" });
    const before = await selectBookmarkRow(db, bookmarkId);
    if (before === undefined) {
      throw new Error("seeded bookmark is missing");
    }

    const result = await setBookmarkFavorite(
      db,
      command("user-a", bookmarkId, true)
    );

    expect(result).toStrictEqual({ id: bookmarkId, kind: "updated" });
    const row = await selectBookmarkRow(db, bookmarkId);
    expect(row?.favorite).toBe(true);
    expect(row?.updatedAt.getTime()).toBeGreaterThan(
      before.updatedAt.getTime()
    );
  });

  test("favorite を解除できる", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await seedBookmark(db, {
      favorite: true,
      id: bookmarkId,
      userId: "user-a",
    });

    const result = await setBookmarkFavorite(
      db,
      command("user-a", bookmarkId, false)
    );

    expect(result).toStrictEqual({ id: bookmarkId, kind: "updated" });
    const row = await selectBookmarkRow(db, bookmarkId);
    expect(row?.favorite).toBe(false);
  });

  test("別ユーザーの行は更新せず bookmark-not-found を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");
    await seedBookmark(db, { id: bookmarkId, userId: "user-a" });

    const result = await setBookmarkFavorite(
      db,
      command("user-b", bookmarkId, true)
    );

    expect(result).toStrictEqual({ kind: "bookmark-not-found" });
    const row = await selectBookmarkRow(db, bookmarkId);
    expect(row?.favorite).toBe(false);
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

    const result = await setBookmarkFavorite(
      db,
      command("user-a", bookmarkId, true)
    );

    expect(result).toStrictEqual({ kind: "bookmark-not-found" });
    const after = await selectBookmarkRow(db, bookmarkId);
    expect(after?.favorite).toBe(false);
    expect(after?.updatedAt.getTime()).toBe(before?.updatedAt.getTime());
  });

  test("存在しない id は bookmark-not-found を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");

    const result = await setBookmarkFavorite(
      db,
      command("user-a", bookmarkId, true)
    );

    expect(result).toStrictEqual({ kind: "bookmark-not-found" });
  });
});
