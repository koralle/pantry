import { describe, expect, test } from 'vitest'

import { selectShelfTags } from './select-shelf-tags'
import { createMemoryDb, parseUserId, seedBookmark, seedTag, seedUser } from './test-helpers'

describe('selectShelfTags', () => {
  test('本人のタグだけを bookmarkCount 付きで返す', async () => {
    const db = await createMemoryDb()
    await seedUser(db, 'user-a')
    await seedUser(db, 'user-b')
    const workId = await seedTag(db, {
      userId: 'user-a',
      name: 'work',
      pinned: true,
      color: '#2f6fed'
    })
    const privateId = await seedTag(db, { userId: 'user-b', name: 'private' })
    const inboxId = await seedTag(db, { userId: 'user-a', name: 'inbox' })
    await seedBookmark(db, { id: 'bm-1', userId: 'user-a', tagIds: [workId] })
    await seedBookmark(db, { id: 'bm-2', userId: 'user-b', tagIds: [privateId] })

    const rows = await selectShelfTags(db, parseUserId('user-a'))

    expect(rows).toHaveLength(2)
    const byName = new Map(rows.map((row) => [row.name, row]))
    expect(byName.get('work')).toEqual({
      id: workId,
      name: 'work',
      pinned: true,
      sortOrder: 0,
      color: '#2f6fed',
      lastUsedAt: null,
      bookmarkCount: 1
    })
    expect(byName.get('inbox')).toMatchObject({ id: inboxId, bookmarkCount: 0 })
  })

  test('他ユーザーのブックマークは bookmarkCount に含めない', async () => {
    const db = await createMemoryDb()
    await seedUser(db, 'user-a')
    await seedUser(db, 'user-b')
    const workId = await seedTag(db, { userId: 'user-a', name: 'work' })
    await seedBookmark(db, { id: 'bm-a', userId: 'user-a', tagIds: [workId] })
    await seedBookmark(db, { id: 'bm-b', userId: 'user-b', tagIds: [workId] })

    const rows = await selectShelfTags(db, parseUserId('user-a'))

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ id: workId, bookmarkCount: 1 })
  })

  test('削除済みブックマークは bookmarkCount に含めない', async () => {
    const db = await createMemoryDb()
    await seedUser(db, 'user-a')
    const readingId = await seedTag(db, { userId: 'user-a', name: 'reading' })
    await seedBookmark(db, { id: 'bm-live', userId: 'user-a', tagIds: [readingId] })
    await seedBookmark(db, { id: 'bm-dead', userId: 'user-a', deleted: true, tagIds: [readingId] })

    const rows = await selectShelfTags(db, parseUserId('user-a'))

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ id: readingId, bookmarkCount: 1 })
  })

  test('lastUsedAt を Date として返す', async () => {
    const db = await createMemoryDb()
    await seedUser(db, 'user-a')
    const lastUsedAt = new Date('2026-08-01T00:00:00.000Z')
    await seedTag(db, { userId: 'user-a', name: 'recent', lastUsedAt })

    const rows = await selectShelfTags(db, parseUserId('user-a'))

    expect(rows[0]?.lastUsedAt).toEqual(lastUsedAt)
  })
})
