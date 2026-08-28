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
import { decodeBookmarkListCursor } from '../lib/bookmark-list-cursor'
import { BOOKMARK_LIST_PAGE_SIZE } from '../lib/bookmark-list-page-size'
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

async function attachTag(db: AppDb, id: string, tagId: number) {
  await db.insert(bookmarkTagsTable).values({ bookmarkId: id, tagId })
}

function query(
  userId: string,
  overrides: Partial<BookmarkListQuery> = {}
): Parameters<typeof listBookmarks>[1] {
  return {
    userId: v.parse(userIdSchema, userId),
    tagMode: 'and',
    sort: 'newest',
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

    const page = await listBookmarks(db, query('user-a'))

    expect(page.items.map((item) => item.id)).toEqual(['b-new', 'b-old'])
    expect(page.nextCursor).toBeNull()
    expect(page.items[0]).toEqual({
      id: 'b-new',
      url: 'https://example.com/b-new',
      title: '新しい',
      note: null,
      updatedAt: new Date('2026-08-01T00:00:00.000Z').toISOString(),
      tags: [{ id: readingId, name: 'reading' }]
    })
    expect(page.items[1]?.tags).toEqual([])
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

    const page = await listBookmarks(db, query('user-a'))

    expect(page.items.map((item) => item.id)).toEqual([])
    expect(page.nextCursor).toBeNull()
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

    expect(byTitle.items.map((item) => item.id)).toEqual(['b-title'])
    expect(byUrl.items.map((item) => item.id)).toEqual(['b-url'])
    expect(byNote.items.map((item) => item.id)).toEqual(['b-note'])
    expect(none.items).toEqual([])
  })

  test(String.raw`q の % _ \ はワイルドカードではなくリテラルとして一致させる`, async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertBookmark(db, { id: 'b-literal', userId: 'user-a', title: '50%_off' })
    await insertBookmark(db, { id: 'b-wildcard', userId: 'user-a', title: '50Xoff' })

    const items = await listBookmarks(db, query('user-a', { q: '50%_' }))

    expect(items.items.map((item) => item.id)).toEqual(['b-literal'])
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

    expect(andResult.items.map((item) => item.id)).toEqual(['b-both'])
    expect(orResult.items.map((item) => item.id)).toEqual(['b-reading', 'b-both'])
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

    expect(items.items.map((item) => item.id)).toEqual(['b-1'])
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

    expect(items.items.map((item) => item.id)).toEqual(['b-new', 'b-old'])
  })

  test('21件以上あるとき初回は先頭20件と nextCursor を返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertSequentialBookmarks(db, 'user-a', BOOKMARK_LIST_PAGE_SIZE + 1)

    const page = await listBookmarks(db, query('user-a'))

    expect(page.items.map((item) => item.id)).toEqual(
      idsFrom(0, BOOKMARK_LIST_PAGE_SIZE + 1)
        .toReversed()
        .slice(0, BOOKMARK_LIST_PAGE_SIZE)
    )
    expect(page.nextCursor).not.toBeNull()
  })

  test('続きは cursor で取り、offset なしで欠落・重複しない', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertSequentialBookmarks(db, 'user-a', BOOKMARK_LIST_PAGE_SIZE + 5)

    const first = await listBookmarks(db, query('user-a'))
    const second = await listBookmarks(
      db,
      query('user-a', first.nextCursor === null ? {} : { cursor: first.nextCursor })
    )

    const allIds = [...first.items, ...second.items].map((item) => item.id)
    expect(allIds).toEqual(idsFrom(0, BOOKMARK_LIST_PAGE_SIZE + 5).toReversed())
    expect(new Set(allIds).size).toBe(allIds.length)
    expect(second.items).toHaveLength(5)
    expect(second.nextCursor).toBeNull()
  })

  test('ちょうど20件のときは nextCursor がなく空の追加取得を要求しない', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertSequentialBookmarks(db, 'user-a', BOOKMARK_LIST_PAGE_SIZE)

    const page = await listBookmarks(db, query('user-a'))

    expect(page.items).toHaveLength(BOOKMARK_LIST_PAGE_SIZE)
    expect(page.nextCursor).toBeNull()
  })

  test('同一 createdAt でも id の補助並びでページ境界の欠落・重複がない', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    const ids = idsFrom(0, BOOKMARK_LIST_PAGE_SIZE + 3)
    for (const id of ids) {
      await insertBookmark(db, {
        id,
        userId: 'user-a',
        title: id,
        createdAt: base,
        updatedAt: base
      })
    }

    const first = await listBookmarks(db, query('user-a'))
    const second = await listBookmarks(
      db,
      query('user-a', first.nextCursor === null ? {} : { cursor: first.nextCursor })
    )
    const allIds = [...first.items, ...second.items].map((item) => item.id)

    expect(allIds).toEqual([...ids].toReversed())
    expect(new Set(allIds).size).toBe(ids.length)
  })

  test('同一 updatedAt でも updated 順のページ境界で欠落・重複がない', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    const ids = idsFrom(0, BOOKMARK_LIST_PAGE_SIZE + 2)
    for (const [index, id] of ids.entries()) {
      await insertBookmark(db, {
        id,
        userId: 'user-a',
        title: id,
        createdAt: new Date(base.getTime() + index),
        updatedAt: base
      })
    }

    const first = await listBookmarks(db, query('user-a', { sort: 'updated' }))
    const second = await listBookmarks(
      db,
      query(
        'user-a',
        first.nextCursor === null
          ? { sort: 'updated' }
          : { sort: 'updated', cursor: first.nextCursor }
      )
    )
    const allIds = [...first.items, ...second.items].map((item) => item.id)

    expect(allIds).toEqual([...ids].toReversed())
    expect(new Set(allIds).size).toBe(ids.length)
  })

  test('cursor があっても現在の検索・タグ条件と所有者境界を迂回しない', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertUser(db, 'user-b')
    const readingId = await insertTag(db, { userId: 'user-a', name: 'reading' })
    await insertBookmark(db, { id: 'a-old', userId: 'user-a', title: '古い', createdAt: base })
    await insertBookmark(db, {
      id: 'a-tagged',
      userId: 'user-a',
      title: 'tagged',
      createdAt: newer
    })
    await insertBookmark(db, { id: 'b-other', userId: 'user-b', title: '他人', createdAt: newer })
    await attachTag(db, 'a-tagged', readingId)

    const first = await listBookmarks(
      db,
      query('user-a', { tagNames: ['reading'], tagMode: 'and' })
    )
    const leaked = await listBookmarks(
      db,
      query('user-a', {
        tagNames: ['reading'],
        tagMode: 'and',
        cursor: first.nextCursor ?? encodeFromItem('a-old', base)
      })
    )

    expect(first.items.map((item) => item.id)).toEqual(['a-tagged'])
    expect(leaked.items.map((item) => item.id)).not.toContain('a-old')
    expect(leaked.items.map((item) => item.id)).not.toContain('b-other')
  })

  test('nextCursor は選択中の並びの末尾位置を表す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertSequentialBookmarks(db, 'user-a', BOOKMARK_LIST_PAGE_SIZE + 1)

    const page = await listBookmarks(db, query('user-a'))
    const last = page.items.at(-1)
    const decoded = decodeBookmarkListCursor(page.nextCursor ?? '')

    expect(last).toBeDefined()
    expect(decoded?.id).toBe(last?.id)
  })

  test('projection に不要な列（userId, createdAt, deletedAt）を載せない', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertBookmark(db, { id: 'b-1', userId: 'user-a', title: '最小' })

    const page = await listBookmarks(db, query('user-a'))
    const [item] = page.items

    expect(Object.keys(item ?? {})).toEqual(['id', 'url', 'title', 'note', 'updatedAt', 'tags'])
  })
})

function idsFrom(start: number, count: number): string[] {
  return Array.from({ length: count }, (_, index) => bookmarkId(start + index))
}

function bookmarkId(index: number): string {
  return `id-${String(index).padStart(3, '0')}`
}

async function insertSequentialBookmarks(db: AppDb, userId: string, count: number) {
  for (let index = 0; index < count; index += 1) {
    const id = bookmarkId(index)
    await insertBookmark(db, {
      id,
      userId,
      title: id,
      createdAt: new Date(base.getTime() + index * 1000),
      updatedAt: new Date(base.getTime() + index * 1000)
    })
  }
}

function encodeFromItem(id: string, at: Date): string {
  return `${at.getTime()}:${id}`
}
