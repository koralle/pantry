import { createClient } from "@libsql/client";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import * as v from "valibot";
import { describe, expect, test } from "vitest";

import type { AppDb } from "../../../db/app-db";
import { user } from "../../../db/schema/auth-schema";
import { bookmarkTable } from "../../../db/schema/bookmark";
import { userIdSchema } from "../../auth/domain/auth-values";
import type { SetBookmarkFavoriteInput } from "../application/set-bookmark-favorite";
import { setBookmarkFavorite } from "./set-bookmark-favorite";

const bookmarkId = "019fae92-3bb0-78cd-b488-65ce0e26a001";

/**
 * Libsql の `:memory:` は workerd で動かないので、このファイルは Node project で走らせる。
 * 本番と同じ UNIQUE `(user_id, url)` と soft delete 列を置く。
 */
async function createMemoryDb(): Promise<AppDb> {
  const client = createClient({ url: ":memory:" });
  const db = drizzle({ client });

  await db.run(sql`
    CREATE TABLE users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      role TEXT,
      banned INTEGER,
      ban_reason TEXT,
      ban_expires INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE bookmarks (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      note TEXT,
      created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
      updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
      favorite INTEGER NOT NULL DEFAULT 0,
      deleted_at INTEGER,
      UNIQUE (user_id, url)
    )
  `);

  return db;
}

async function insertUser(db: AppDb, id: string) {
  await db.insert(user).values({ email: `${id}@example.com`, id, name: id });
}

async function insertBookmark(
  db: AppDb,
  input: {
    id: string;
    userId: string;
    url?: string;
    favorite?: boolean;
    deletedAt?: Date | null;
  }
) {
  const now = new Date("2026-08-01T00:00:00.000Z");
  await db.insert(bookmarkTable).values({
    createdAt: now,
    deletedAt: input.deletedAt ?? null,
    favorite: input.favorite ?? false,
    id: input.id,
    title: "タイトル",
    updatedAt: now,
    url: input.url ?? `https://example.com/${input.id}`,
    userId: input.userId,
  });
}

async function selectBookmarkRow(db: AppDb, id: string) {
  const [row] = await db
    .select()
    .from(bookmarkTable)
    .where(eq(bookmarkTable.id, id));
  return row;
}

function command(
  userId: string,
  id: string,
  favorite: boolean
): SetBookmarkFavoriteInput {
  return { favorite, id, userId: v.parse(userIdSchema, userId) };
}

describe(setBookmarkFavorite, () => {
  test("所有済み未削除行の favorite を立てて updatedAt を進める", async () => {
    const db = await createMemoryDb();
    await insertUser(db, "user-a");
    await insertBookmark(db, { id: bookmarkId, userId: "user-a" });

    const result = await setBookmarkFavorite(
      db,
      command("user-a", bookmarkId, true)
    );

    expect(result).toStrictEqual({ id: bookmarkId, kind: "updated" });
    const row = await selectBookmarkRow(db, bookmarkId);
    expect(row?.favorite).toBe(true);
    expect(row?.updatedAt.getTime()).toBeGreaterThan(
      new Date("2026-08-01T00:00:00.000Z").getTime()
    );
  });

  test("favorite を解除できる", async () => {
    const db = await createMemoryDb();
    await insertUser(db, "user-a");
    await insertBookmark(db, {
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
    const db = await createMemoryDb();
    await insertUser(db, "user-a");
    await insertUser(db, "user-b");
    await insertBookmark(db, { id: bookmarkId, userId: "user-a" });

    const result = await setBookmarkFavorite(
      db,
      command("user-b", bookmarkId, true)
    );

    expect(result).toStrictEqual({ kind: "bookmark-not-found" });
    const row = await selectBookmarkRow(db, bookmarkId);
    expect(row?.favorite).toBe(false);
  });

  test("削除済みの行は更新せず bookmark-not-found を返す", async () => {
    const db = await createMemoryDb();
    await insertUser(db, "user-a");
    const deletedAt = new Date("2026-08-05T00:00:00.000Z");
    await insertBookmark(db, { deletedAt, id: bookmarkId, userId: "user-a" });
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
    const db = await createMemoryDb();
    await insertUser(db, "user-a");

    const result = await setBookmarkFavorite(
      db,
      command("user-a", bookmarkId, true)
    );

    expect(result).toStrictEqual({ kind: "bookmark-not-found" });
  });
});
