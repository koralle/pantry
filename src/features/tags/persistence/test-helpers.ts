import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import * as v from 'valibot'

import { user } from '../../../db/schema/auth-schema'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { tagsTable } from '../../../db/schema/tag'
import { userIdSchema } from '../../auth/domain/auth-values'
import type { UserId } from '../../auth/domain/auth-values'

export function parseUserId(value: string): UserId {
  return v.parse(userIdSchema, value)
}

/**
 * Libsql の `:memory:` は workerd で動かないので、このヘルパーは Node project で使う。
 * 本番スキーマと同じ unique 制約と foreign key を置き、読み取り系 query service の
 * actor 分離と集計を本物の制約・行に乗せて検証する。
 */
export async function createMemoryDb() {
  const client = createClient({ url: ':memory:' })
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

export async function seedUser(db: Awaited<ReturnType<typeof createMemoryDb>>, id: string) {
  await db.insert(user).values({ id, name: id, email: `${id}@example.com` })
}

export async function seedTag(
  db: Awaited<ReturnType<typeof createMemoryDb>>,
  input: {
    userId: string
    name: string
    pinned?: boolean
    sortOrder?: number
    color?: string | null
    lastUsedAt?: Date | null
  }
) {
  const inserted = await db
    .insert(tagsTable)
    .values({
      userId: input.userId,
      name: input.name,
      normalizedName: input.name.toLowerCase(),
      pinned: input.pinned ?? false,
      sortOrder: input.sortOrder ?? 0,
      color: input.color ?? null,
      lastUsedAt: input.lastUsedAt ?? null
    })
    .returning({ id: tagsTable.id })
  const [row] = inserted

  if (row === undefined) {
    throw new Error('seedTag failed to return the inserted row')
  }

  return row.id
}

export async function seedBookmark(
  db: Awaited<ReturnType<typeof createMemoryDb>>,
  input: {
    id: string
    userId: string
    deleted?: boolean
    tagIds: number[]
  }
) {
  await db.insert(bookmarkTable).values({
    id: input.id,
    userId: input.userId,
    url: `https://example.com/${input.id}`,
    title: input.id,
    deletedAt: input.deleted ? new Date() : null
  })
  await db
    .insert(bookmarkTagsTable)
    .values(input.tagIds.map((tagId) => ({ bookmarkId: input.id, tagId })))
}
