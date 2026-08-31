import { eq } from 'drizzle-orm'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { bookmarkTable } from '../../db/schema/bookmark'
import { userIdSchema } from '../../features/auth/domain/auth-values'
import { getBookmarkDetail } from '../../features/bookmarks/persistence/get-bookmark-detail'
import { listBookmarks } from '../../features/bookmarks/persistence/list-bookmarks'
import { softDeleteBookmark } from '../../features/bookmarks/persistence/soft-delete-bookmark'
import { bookmarkId, seedBookmark, seedUser, withPersistenceDb } from './migrated-db'

const targetId = bookmarkId(1)

describe('softDeleteBookmark on migrated libSQL', () => {
  const persistence = withPersistenceDb()

  test('所有済み未削除行を消し、一覧と詳細から除外する', async () => {
    const db = persistence.getDb()
    const actorId = await seedUser(db, 'user-a')
    await seedBookmark(db, { id: targetId, userId: 'user-a', title: '残すな' })

    const result = await softDeleteBookmark(db, { userId: actorId, id: targetId })
    const [row] = await db
      .select({ deletedAt: bookmarkTable.deletedAt })
      .from(bookmarkTable)
      .where(eq(bookmarkTable.id, targetId))
    const page = await listBookmarks(db, {
      userId: v.parse(userIdSchema, 'user-a'),
      tagMode: 'and',
      sort: 'newest'
    })
    const detail = await getBookmarkDetail(db, actorId, { id: targetId })

    expect(result).toEqual({ kind: 'deleted', id: targetId })
    expect(row?.deletedAt).not.toBeNull()
    expect(page.items).toEqual([])
    expect(detail).toBeNull()
  })

  test('削除済みの行は updatedAt を動かさず bookmark-not-found を返す', async () => {
    const db = persistence.getDb()
    const actorId = await seedUser(db, 'user-a')
    const deletedAt = new Date('2026-08-05T00:00:00.000Z')
    const updatedAt = new Date('2026-08-01T00:00:00.000Z')
    await seedBookmark(db, {
      id: targetId,
      userId: 'user-a',
      deletedAt,
      updatedAt
    })

    const result = await softDeleteBookmark(db, { userId: actorId, id: targetId })
    const [row] = await db
      .select({ deletedAt: bookmarkTable.deletedAt, updatedAt: bookmarkTable.updatedAt })
      .from(bookmarkTable)
      .where(eq(bookmarkTable.id, targetId))

    expect(result).toEqual({ kind: 'bookmark-not-found' })
    expect(row?.deletedAt?.getTime()).toBe(deletedAt.getTime())
    expect(row?.updatedAt.getTime()).toBe(updatedAt.getTime())
  })
})
