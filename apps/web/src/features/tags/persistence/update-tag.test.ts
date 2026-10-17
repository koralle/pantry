import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@libsql/client";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import * as v from "valibot";
import { afterEach, describe, expect, test } from "vitest";

import { user } from "../../../db/schema/auth-schema";
import { tagsTable } from "../../../db/schema/tag";
import { userIdSchema } from "../../auth/domain/auth-values";
import type { UpdateTagInput } from "../application/update-tag";
import { tagIdSchema, tagNameSchema } from "../domain/tag-values";
import { updateTag } from "./update-tag";

const persistenceDir = import.meta.dirname;
const memoryUrl = "file::memory:?cache=shared";
const clients: ReturnType<typeof createClient>[] = [];

afterEach(async () => {
  try {
    await clients[0]?.executeMultiple(
      "DROP TABLE IF EXISTS tags; DROP TABLE IF EXISTS users"
    );
  } finally {
    for (const client of clients) {
      client.close();
    }
    clients.length = 0;
  }
});

function createMemoryClient() {
  const client = createClient({ url: memoryUrl });
  clients.push(client);
  return client;
}

function parseUserId(value: string) {
  return v.parse(userIdSchema, value);
}

function parseTagId(value: number) {
  return v.parse(tagIdSchema, value);
}

function parseName(value: string) {
  return v.parse(tagNameSchema, value);
}

type TagFields = Partial<
  Pick<UpdateTagInput, "pinned" | "sortOrder" | "color">
>;

function createCommand({
  userId,
  id,
  name,
  pinned = false,
  sortOrder = 0,
  color = null,
}: { userId: string; id: number; name: string } & TagFields): UpdateTagInput {
  return {
    color,
    id: parseTagId(id),
    name: parseName(name),
    pinned,
    sortOrder,
    userId: parseUserId(userId),
  };
}

/**
 * Libsql の `:memory:` は workerd で動かないので、このファイルは Node project で走らせる。
 * UNIQUE `(user_id, normalized_name)` を本番スキーマと同じ形で置き、衝突判定を本物の制約に乗せる。
 */
async function createMemoryDb() {
  const client = createMemoryClient();
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
    CREATE TABLE tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      color TEXT,
      last_used_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
      updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
      version INTEGER NOT NULL DEFAULT 1,
      UNIQUE (user_id, normalized_name)
    )
  `);

  return db;
}

async function insertUser(
  db: Awaited<ReturnType<typeof createMemoryDb>>,
  id: string
) {
  await db.insert(user).values({
    email: `${id}@example.com`,
    id,
    name: id,
  });
}

async function insertTagRow(
  db: Awaited<ReturnType<typeof createMemoryDb>>,
  {
    userId,
    name,
    pinned = false,
    sortOrder = 0,
    color = null,
  }: { userId: string; name: string } & TagFields
) {
  const parsedName = parseName(name);
  const [created] = await db
    .insert(tagsTable)
    .values({
      color,
      name: parsedName.display,
      normalizedName: parsedName.normalized,
      pinned,
      sortOrder,
      userId: parseUserId(userId),
    })
    .returning({ id: tagsTable.id });

  if (created === undefined) {
    throw new Error("Failed to create test tag");
  }
  return created.id;
}

describe(updateTag, { concurrent: false }, () => {
  test("所有者が全フィールドを更新し TagId を受け取る", async () => {
    const db = await createMemoryDb();
    await insertUser(db, "user-a");
    const id = await insertTagRow(db, { name: "Old", userId: "user-a" });

    const result = await updateTag(
      db,
      createCommand({
        color: "#123456",
        id,
        name: " Work ",
        pinned: true,
        sortOrder: 4,
        userId: "user-a",
      })
    );

    expect(result).toStrictEqual({ id: parseTagId(id), kind: "updated" });
    const [row] = await db
      .select({
        color: tagsTable.color,
        name: tagsTable.name,
        normalizedName: tagsTable.normalizedName,
        pinned: tagsTable.pinned,
        sortOrder: tagsTable.sortOrder,
      })
      .from(tagsTable)
      .where(eq(tagsTable.id, id));
    expect(row).toStrictEqual({
      color: "#123456",
      name: "Work",
      normalizedName: "work",
      pinned: true,
      sortOrder: 4,
    });
  });

  test("存在しない id は not-found を返す", async () => {
    const db = await createMemoryDb();
    await insertUser(db, "user-a");

    const result = await updateTag(
      db,
      createCommand({ id: 999, name: "Missing", userId: "user-a" })
    );

    expect(result).toStrictEqual({ kind: "not-found" });
  });

  test("別ユーザーのタグは not-found を返し変更しない", async () => {
    const db = await createMemoryDb();
    await insertUser(db, "user-a");
    await insertUser(db, "user-b");
    const id = await insertTagRow(db, {
      color: "#000000",
      name: "Private",
      pinned: false,
      sortOrder: 1,
      userId: "user-a",
    });

    const result = await updateTag(
      db,
      createCommand({
        color: "#ffffff",
        id,
        name: "Stolen",
        pinned: true,
        sortOrder: 9,
        userId: "user-b",
      })
    );

    expect(result).toStrictEqual({ kind: "not-found" });
    const [row] = await db
      .select({
        color: tagsTable.color,
        name: tagsTable.name,
        normalizedName: tagsTable.normalizedName,
        pinned: tagsTable.pinned,
        sortOrder: tagsTable.sortOrder,
      })
      .from(tagsTable)
      .where(eq(tagsTable.id, id));
    expect(row).toStrictEqual({
      color: "#000000",
      name: "Private",
      normalizedName: "private",
      pinned: false,
      sortOrder: 1,
    });
  });

  test("同一ユーザーの正規化名が衝突すると name-conflict を返し変更しない", async () => {
    const db = await createMemoryDb();
    await insertUser(db, "user-a");
    await insertTagRow(db, { name: "Work", userId: "user-a" });
    const id = await insertTagRow(db, {
      color: "#111111",
      name: "Personal",
      pinned: false,
      sortOrder: 2,
      userId: "user-a",
    });

    const result = await updateTag(
      db,
      createCommand({
        color: "#eeeeee",
        id,
        name: "WORK",
        pinned: true,
        sortOrder: 8,
        userId: "user-a",
      })
    );

    expect(result).toStrictEqual({ kind: "name-conflict" });
    const [row] = await db
      .select({
        color: tagsTable.color,
        name: tagsTable.name,
        normalizedName: tagsTable.normalizedName,
        pinned: tagsTable.pinned,
        sortOrder: tagsTable.sortOrder,
      })
      .from(tagsTable)
      .where(eq(tagsTable.id, id));
    expect(row).toStrictEqual({
      color: "#111111",
      name: "Personal",
      normalizedName: "personal",
      pinned: false,
      sortOrder: 2,
    });
  });

  test("所有確認の後に行が消えた競合は not-found を返す", async () => {
    const db = await createMemoryDb();
    await insertUser(db, "user-a");
    const id = await insertTagRow(db, { name: "Vanish", userId: "user-a" });

    // 所有 SELECT と UPDATE の隙間で別接続が削除した状況を、BEFORE UPDATE トリガで再現する。
    // 行を消すと UPDATE の対象が消えるため RETURNING は空になり、404 仕分けの分岐に入る。
    await db.run(
      sql.raw(
        `CREATE TRIGGER vanish_after_check BEFORE UPDATE ON tags WHEN OLD.id = ${id} BEGIN DELETE FROM tags WHERE id = ${id}; END`
      )
    );

    const result = await updateTag(
      db,
      createCommand({ id, name: "Renamed", sortOrder: 3, userId: "user-a" })
    );

    expect(result).toStrictEqual({ kind: "not-found" });
  });

  test("汎用 UNIQUE 判定と例外は import しない", () => {
    const source = readFileSync(join(persistenceDir, "update-tag.ts"), "utf-8");
    expect(source).not.toContain("isSqliteUniqueConstraintError");
    expect(source).not.toContain("TagNameAlreadyExistsError");
  });
});
