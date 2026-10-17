import { createClient } from "@libsql/client";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import * as v from "valibot";
import { afterEach, describe, expect, test } from "vitest";

import { bookmarkTable } from "../../../db/schema/bookmark";
import { bookmarkTagsTable } from "../../../db/schema/bookmark-tag";
import { tagsTable } from "../../../db/schema/tag";
import { tagIdSchema } from "../domain/tag-values";
import { deleteTag } from "./delete-tag";
import { parseUserId, seedBookmark, seedTag, seedUser } from "./test-helpers";

const memoryUrl = "file::memory:?cache=shared";
const clients: ReturnType<typeof createClient>[] = [];

afterEach(async () => {
  try {
    await clients[0]?.executeMultiple(
      "DROP TABLE IF EXISTS bookmark_tags; DROP TABLE IF EXISTS bookmarks; DROP TABLE IF EXISTS tags; DROP TABLE IF EXISTS users"
    );
  } finally {
    for (const client of clients) {
      client.close();
    }
    clients.length = 0;
  }
});

const parseTagId = (value: number) => v.parse(tagIdSchema, value);

/**
 * `db.transaction` は transaction 内のクエリを別接続で実行するため、
 * 非 shared の `:memory:` ではテーブルが見えない。shared cache の in-memory を使う。
 */
async function createMemoryDb() {
  const client = createClient({ url: memoryUrl });
  clients.push(client);
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
      id INTEGER PRIMARY KEY NOT NULL,
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

  await db.run(sql`
    CREATE TABLE bookmark_tags (
      bookmark_id TEXT NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE (bookmark_id, tag_id)
    )
  `);

  return db;
}

describe(deleteTag, () => {
  test("本人のタグは紐付けごと消え、ブックマーク本体は残る", async () => {
    const db = await createMemoryDb();
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
    const db = await createMemoryDb();
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
    const db = await createMemoryDb();
    await seedUser(db, "user-a");

    const output = await deleteTag(db, {
      id: parseTagId(999),
      userId: parseUserId("user-a"),
    });

    expect(output).toStrictEqual({ kind: "not-found" });
  });
});
