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
import type { BookmarkListQuery } from './list-bookmarks'
import { listBookmarks } from './list-bookmarks'

/**
 * Libsql の `:memory:` は workerd で動かないので、このファイルは Node project で走らせる。
 * 本番と同じ UNIQUE 制約と FK を置き、一覧 projection を本物の SQLite で検証する。
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
    userId: string
    title: string
    url?: string
    note?: string | null
    createdAt?: Date
    updatedAt?: Date
    deletedAt?: Date | null
  }
) {
  await db.insert(bookmarkTable).values({
    id: input.id,
    userId: input.userId,
    url: input.url ?? `https://example.com/${input.id}`,
    title: input.title,
    note: input.note ?? null,
    createdAt: input.createdAt ?? new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: input.updatedAt ?? new Date('2026-08-01T00:00:00.000Z'),
    deletedAt: input.deletedAt ?? null
  })
}

async function attachTag(db: AppDb, bookmarkId: string, tagId: number) {
  await db.insert(bookmarkTagsTable).values({ bookmarkId, tagId })
}

function query(
  userId: string,
  overrides: Partial<BookmarkListQuery> = {}
): Parameters<typeof listBookmarks>[1] {
  return {
    userId: v.parse(userIdSchema, userId),
    tagMode: 'and',
    sort: 'newest',
    limit: 50,
    offset: 0,
    ...overrides
  }
}

const base = new Date('2026-08-01T00:00:00.000Z')
const newer = new Date('2026-08-10T00:00:00.000Z')

describe('listBookmarks', () => {
  test('自分の未削除ブックマークを新着順とタグ付きで返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    const readingId = await insertTag(db, { userId: 'user-a', name: 'reading' })
    await insertBookmark(db, { id: 'b-old', userId: 'user-a', title: '古い', createdAt: base })
    await insertBookmark(db, { id: 'b-new', userId: 'user-a', title: '新しい', createdAt: newer })
    await attachTag(db, 'b-new', readingId)

    const items = await listBookmarks(db, query('user-a'))

    expect(items.map((item) => item.id)).toEqual(['b-new', 'b-old'])
    expect(items[0]).toEqual({
      id: 'b-new',
      url: 'https://example.com/b-new',
      title: '新しい',
      note: null,
      updatedAt: new Date('2026-08-01T00:00:00.000Z').toISOString(),
      tags: [{ id: readingId, name: 'reading' }]
    })
    expect(items[1]?.tags).toEqual([])
  })

  test('削除済みと他人のブックマークは返さない', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertUser(db, 'user-b')
    await insertBookmark(db, {
      id: 'b-deleted',
      userId: 'user-a',
      title: '消済み',
      deletedAt: base
    })
    await insertBookmark(db, { id: 'b-other', userId: 'user-b', title: '他人' })

    const items = await listBookmarks(db, query('user-a'))

    expect(items.map((item) => item.id)).toEqual([])
  })

  test('q はタイトル、URL、メモの部分一致で絞る', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertBookmark(db, { id: 'b-title', userId: 'user-a', title: 'React 19 の use()' })
    await insertBookmark(db, { id: 'b-url', userId: 'user-a', title: '無関係' })
    await insertBookmark(db, {
      id: 'b-note',
      userId: 'user-a',
      title: '無関係2',
      note: 'zenn の記事'
    })

    const byTitle = await listBookmarks(db, query('user-a', { q: 'React' }))
    const byUrl = await listBookmarks(db, query('user-a', { q: 'example.com/b-url' }))
    const byNote = await listBookmarks(db, query('user-a', { q: 'zenn' }))
    const none = await listBookmarks(db, query('user-a', { q: '存在しない' }))

    expect(byTitle.map((item) => item.id)).toEqual(['b-title'])
    expect(byUrl.map((item) => item.id)).toEqual(['b-url'])
    expect(byNote.map((item) => item.id)).toEqual(['b-note'])
    expect(none).toEqual([])
  })

  test('タグ AND は全て持つブックマークだけ、OR はどれかを含む', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    const readingId = await insertTag(db, { userId: 'user-a', name: 'reading' })
    const workId = await insertTag(db, { userId: 'user-a', name: 'work' })
    await insertBookmark(db, { id: 'b-both', userId: 'user-a', title: '両方' })
    await insertBookmark(db, { id: 'b-reading', userId: 'user-a', title: 'readingのみ' })
    await attachTag(db, 'b-both', readingId)
    await attachTag(db, 'b-both', workId)
    await attachTag(db, 'b-reading', readingId)

    const andResult = await listBookmarks(
      db,
      query('user-a', { tagNames: ['reading', 'work'], tagMode: 'and' })
    )
    const orResult = await listBookmarks(
      db,
      query('user-a', { tagNames: ['reading', 'work'], tagMode: 'or' })
    )

    expect(andResult.map((item) => item.id)).toEqual(['b-both'])
    expect(orResult.map((item) => item.id)).toEqual(['b-both', 'b-reading'])
  })

  test('tagNames は正規化して照合し、q は trim する', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    const readingId = await insertTag(db, { userId: 'user-a', name: 'reading' })
    await insertBookmark(db, { id: 'b-1', userId: 'user-a', title: '前パディング後' })
    await attachTag(db, 'b-1', readingId)

    const items = await listBookmarks(
      db,
      query('user-a', { q: '  パディング  ', tagNames: ['Reading', 'reading'] })
    )

    expect(items.map((item) => item.id)).toEqual(['b-1'])
  })

  test('sort updated は updatedAt の降順で返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertBookmark(db, {
      id: 'b-old',
      userId: 'user-a',
      title: '古い更新',
      createdAt: newer,
      updatedAt: base
    })
    await insertBookmark(db, {
      id: 'b-new',
      userId: 'user-a',
      title: '新しい更新',
      createdAt: base,
      updatedAt: newer
    })

    const items = await listBookmarks(db, query('user-a', { sort: 'updated' }))

    expect(items.map((item) => item.id)).toEqual(['b-new', 'b-old'])
  })

  test('limit と offset でページングする', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    for (const [index, id] of ['b-1', 'b-2', 'b-3'].entries()) {
      await insertBookmark(db, {
        id,
        userId: 'user-a',
        title: id,
        createdAt: new Date(base.getTime() + index * 1000)
      })
    }

    const page = await listBookmarks(db, query('user-a', { limit: 2, offset: 1 }))

    expect(page.map((item) => item.id)).toEqual(['b-2', 'b-1'])
  })

  test('projection に不要な列（userId, createdAt, deletedAt）を載せない', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertBookmark(db, { id: 'b-1', userId: 'user-a', title: '最小' })

    const [item] = await listBookmarks(db, query('user-a'))

    expect(Object.keys(item ?? {})).toEqual(['id', 'url', 'title', 'note', 'updatedAt', 'tags'])
  })
})
