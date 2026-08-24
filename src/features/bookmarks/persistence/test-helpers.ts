import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import * as v from 'valibot'

import type { AppDb } from '../../../db/app-db'
import { user } from '../../../db/schema/auth-schema'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { tagsTable } from '../../../db/schema/tag'

/**
 * Libsql のローカル client は transaction のたびに接続を張り直すため、
 * 単純な `:memory:` では transaction を挟んだ時点で別の空 DB になってしまう。
 * shared cache 付きの `file::memory:` で全接続から同じ DB を見るようにし、
 * テスト終了時に client を閉じて DB も捨てる。
 */
const memoryUrl = 'file::memory:?cache=shared'
const clients: ReturnType<typeof createClient>[] = []

export async function closeMemoryClients(): Promise<void> {
  try {
    await clients[0]?.executeMultiple(
      'DROP TABLE IF EXISTS bookmark_tags; DROP TABLE IF EXISTS bookmarks; DROP TABLE IF EXISTS tags; DROP TABLE IF EXISTS users;'
    )
  } finally {
    for (const client of clients) {
      client.close()
    }
    clients.length = 0
  }
}

export async function createMemoryDb(): Promise<AppDb> {
  const client = createClient({ url: memoryUrl })
  clients.push(client)
  const db = drizzle({ client })

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
  `)

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
  `)

  await db.run(sql`
    CREATE TABLE bookmarks (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      note TEXT,
      created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
      updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
      deleted_at INTEGER,
      UNIQUE (user_id, url)
    )
  `)

  await db.run(sql`
    CREATE TABLE bookmark_tags (
      bookmark_id TEXT NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE (bookmark_id, tag_id)
    )
  `)

  return db
}

type MemoryDb = Awaited<ReturnType<typeof createMemoryDb>>

export async function insertUser(db: MemoryDb, id: string): Promise<void> {
  await db.insert(user).values({
    id,
    name: id,
    email: `${id}@example.com`
  })
}

export function insertTagRow(db: MemoryDb, userId: string, name: string): Promise<number> {
  return db
    .insert(tagsTable)
    .values({ userId, name, normalizedName: name.toLowerCase() })
    .returning({ id: tagsTable.id })
    .then(([row]) => v.parse(v.number(), row?.id))
}

export async function insertBookmarkRow(
  db: MemoryDb,
  values: {
    readonly id: string
    readonly userId: string
    readonly url: string
    readonly title?: string
    readonly note?: string | null
    readonly deletedAt?: Date | null
  }
): Promise<void> {
  await db.insert(bookmarkTable).values({
    id: values.id,
    userId: values.userId,
    url: values.url,
    title: values.title ?? 'Seed Title',
    note: values.note ?? null,
    ...(values.deletedAt === undefined ? {} : { deletedAt: values.deletedAt })
  })
}

export function insertBookmarkTagRow(
  db: MemoryDb,
  bookmarkId: string,
  tagId: number
): Promise<void> {
  return db
    .insert(bookmarkTagsTable)
    .values({ bookmarkId, tagId })
    .then(() => undefined)
}
