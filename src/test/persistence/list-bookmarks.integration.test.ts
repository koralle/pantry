import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { user } from '../../db/schema/auth-schema'
import { bookmarkTable } from '../../db/schema/bookmark'
import { tagsTable } from '../../db/schema/tag'
import { userIdSchema } from '../../features/auth/domain/auth-values'
import { decodeBookmarkListCursor } from '../../features/bookmarks/lib/bookmark-list-cursor'
import { BOOKMARK_LIST_PAGE_SIZE } from '../../features/bookmarks/lib/bookmark-list-page-size'
import type { BookmarkListQuery } from '../../features/bookmarks/persistence/list-bookmarks'
import { listBookmarks } from '../../features/bookmarks/persistence/list-bookmarks'
import {
  bookmarkId,
  seedBookmark,
  seedBookmarks,
  seedTag,
  seedUser,
  withPersistenceDb
} from './migrated-db'

const base = new Date('2026-08-01T00:00:00.000Z')

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

describe('listBookmarks on migrated libSQL', () => {
  const persistence = withPersistenceDb()

  test('21件以上あるとき初回は先頭20件と nextCursor を返し、続きは欠落・重複しない', async () => {
    const db = persistence.getDb()
    await seedUser(db, 'user-a')
    const count = BOOKMARK_LIST_PAGE_SIZE + 5
    await seedBookmarks(
      db,
      Array.from({ length: count }, (_, index) => {
        const id = bookmarkId(index)
        return {
          id,
          userId: 'user-a',
          createdAt: new Date(base.getTime() + index * 1000),
          updatedAt: new Date(base.getTime() + index * 1000)
        }
      })
    )

    const first = await listBookmarks(db, query('user-a'))
    const second = await listBookmarks(
      db,
      query('user-a', first.nextCursor === null ? {} : { cursor: first.nextCursor })
    )
    const allIds = [...first.items, ...second.items].map((item) => item.id)
    const expected = Array.from({ length: count }, (_, index) => bookmarkId(index)).toReversed()

    expect(first.items).toHaveLength(BOOKMARK_LIST_PAGE_SIZE)
    expect(first.nextCursor).not.toBeNull()
    expect(allIds).toEqual(expected)
    expect(new Set(allIds).size).toBe(count)
    expect(second.nextCursor).toBeNull()
  })

  test('同一 createdAt でも id の補助並びでページ境界の欠落・重複がない', async () => {
    const db = persistence.getDb()
    await seedUser(db, 'user-a')
    const ids = Array.from({ length: BOOKMARK_LIST_PAGE_SIZE + 3 }, (_, index) => bookmarkId(index))
    await seedBookmarks(
      db,
      ids.map((id) => ({
        id,
        userId: 'user-a',
        createdAt: base,
        updatedAt: base
      }))
    )

    const first = await listBookmarks(db, query('user-a'))
    const second = await listBookmarks(
      db,
      query('user-a', first.nextCursor === null ? {} : { cursor: first.nextCursor })
    )
    const allIds = [...first.items, ...second.items].map((item) => item.id)

    expect(allIds).toEqual([...ids].toReversed())
    expect(new Set(allIds).size).toBe(ids.length)
    expect(decodeBookmarkListCursor(first.nextCursor ?? '')?.id).toBe(first.items.at(-1)?.id)
  })

  test('タグ AND は全て持つブックマークだけ、OR はどれかを含む', async () => {
    const db = persistence.getDb()
    await seedUser(db, 'user-a')
    const readingId = await seedTag(db, { userId: 'user-a', name: 'reading' })
    const workId = await seedTag(db, { userId: 'user-a', name: 'work' })
    await seedBookmark(db, {
      id: bookmarkId(1),
      userId: 'user-a',
      title: '両方',
      tagIds: [readingId, workId]
    })
    await seedBookmark(db, {
      id: bookmarkId(2),
      userId: 'user-a',
      title: 'readingのみ',
      tagIds: [readingId]
    })

    const andResult = await listBookmarks(
      db,
      query('user-a', { tagNames: ['reading', 'work'], tagMode: 'and' })
    )
    const orResult = await listBookmarks(
      db,
      query('user-a', { tagNames: ['reading', 'work'], tagMode: 'or' })
    )

    expect(andResult.items.map((item) => item.id)).toEqual([bookmarkId(1)])
    expect(orResult.items.map((item) => item.id)).toEqual([bookmarkId(2), bookmarkId(1)])
  })

  test(String.raw`q の % _ はワイルドカードではなくリテラルとして一致させる`, async () => {
    const db = persistence.getDb()
    await seedUser(db, 'user-a')
    await seedBookmark(db, { id: bookmarkId(1), userId: 'user-a', title: '50%_off' })
    await seedBookmark(db, { id: bookmarkId(2), userId: 'user-a', title: '50Xoff' })

    const page = await listBookmarks(db, query('user-a', { q: '50%_' }))

    expect(page.items.map((item) => item.id)).toEqual([bookmarkId(1)])
  })

  test('削除済みと他人のブックマークは返さない', async () => {
    const db = persistence.getDb()
    await seedUser(db, 'user-a')
    await seedUser(db, 'user-b')
    await seedBookmark(db, {
      id: bookmarkId(1),
      userId: 'user-a',
      title: '消済み',
      deletedAt: base
    })
    await seedBookmark(db, { id: bookmarkId(2), userId: 'user-b', title: '他人' })
    await seedBookmark(db, { id: bookmarkId(3), userId: 'user-a', title: '自分' })

    const page = await listBookmarks(db, query('user-a'))

    expect(page.items.map((item) => item.id)).toEqual([bookmarkId(3)])
  })

  test('reset 後は前テストの行に依存せず空から始まる', async () => {
    const db = persistence.getDb()
    const leftoverUsers = await db.select({ id: user.id }).from(user)
    const leftoverBookmarks = await db.select({ id: bookmarkTable.id }).from(bookmarkTable)
    const leftoverTags = await db.select({ id: tagsTable.id }).from(tagsTable)

    expect(leftoverUsers).toEqual([])
    expect(leftoverBookmarks).toEqual([])
    expect(leftoverTags).toEqual([])
  })
})
