import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import type { AppDb } from '../../../db/app-db'
import { user } from '../../../db/schema/auth-schema'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { tagsTable } from '../../../db/schema/tag'
import { userIdSchema } from '../../auth/domain/auth-values'
import { getBookmarkDetail } from './get-bookmark-detail'

/**
 * Libsql の `:memory:` は workerd で動かないので、このファイルは Node project で走らせる。
 * 詳細画面の projection（bookmark 項目 + tagNames）を本物の SQLite 結合で検証する。
 */
async function createMemoryDb(): Promise<AppDb> {
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

async function insertUser(db: AppDb, id: string) {
  await db.insert(user).values({ id, name: id, email: `${id}@example.com` })
}

let nextTagId = 1

async function insertTag(db: AppDb, input: { userId: string; name: string }) {
  const tagId = nextTagId
  nextTagId += 1
  await db.insert(tagsTable).values({
    id: tagId,
    userId: input.userId,
    name: input.name,
    normalizedName: input.name.toLowerCase()
  })
  return tagId
}

async function insertBookmark(
  db: AppDb,
  input: {
    id: string
    userId?: string
    title?: string
    note?: string | null
    deletedAt?: Date | null
  }
) {
  await db.insert(bookmarkTable).values({
    id: input.id,
    userId: input.userId ?? 'user-a',
    url: `https://example.com/${input.id}`,
    title: input.title ?? 'タイトル',
    note: input.note ?? null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-02T00:00:00.000Z'),
    deletedAt: input.deletedAt ?? null
  })
}

async function attachTag(db: AppDb, bookmarkId: string, tagId: number) {
  await db.insert(bookmarkTagsTable).values({ bookmarkId, tagId })
}

function actor(userId: string) {
  return v.parse(userIdSchema, userId)
}

describe('getBookmarkDetail', () => {
  test('自分の未削除ブックマークを tagNames 付きで返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertTag(db, { userId: 'user-a', name: 'work' })
    const readingId = await insertTag(db, { userId: 'user-a', name: 'reading' })
    await insertBookmark(db, { id: 'b-1', title: '詳細', note: 'メモ' })
    await attachTag(db, 'b-1', readingId)

    const detail = await getBookmarkDetail(db, actor('user-a'), { id: 'b-1' })

    expect(detail).toEqual({
      id: 'b-1',
      url: 'https://example.com/b-1',
      title: '詳細',
      note: 'メモ',
      createdAt: new Date('2026-08-01T00:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-08-02T00:00:00.000Z').toISOString(),
      tagNames: ['reading']
    })
  })

  test('tagNames はタグ名の昇順で返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    const workId = await insertTag(db, { userId: 'user-a', name: 'work' })
    const readingId = await insertTag(db, { userId: 'user-a', name: 'reading' })
    await insertBookmark(db, { id: 'b-1' })
    await attachTag(db, 'b-1', workId)
    await attachTag(db, 'b-1', readingId)

    const detail = await getBookmarkDetail(db, actor('user-a'), { id: 'b-1' })

    expect(detail?.tagNames).toEqual(['reading', 'work'])
  })

  test('他人のブックマークは null を返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertUser(db, 'user-b')
    await insertBookmark(db, { id: 'b-1' })

    const detail = await getBookmarkDetail(db, actor('user-b'), { id: 'b-1' })

    expect(detail).toBeNull()
  })

  test('削除済みブックマークは null を返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertBookmark(db, { id: 'b-1', deletedAt: new Date('2026-08-03T00:00:00.000Z') })

    const detail = await getBookmarkDetail(db, actor('user-a'), { id: 'b-1' })

    expect(detail).toBeNull()
  })

  test('存在しない id は null を返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')

    const detail = await getBookmarkDetail(db, actor('user-a'), { id: 'missing' })

    expect(detail).toBeNull()
  })
})
