import { describe, expect, test } from 'vitest'

import { selectTagById } from './select-tag-by-id'
import { createMemoryDb, parseUserId, seedTag, seedUser } from './test-helpers'

describe('selectTagById', () => {
  test('本人のタグなら画面 projection を返す', async () => {
    const db = await createMemoryDb()
    await seedUser(db, 'user-a')
    const id = await seedTag(db, {
      userId: 'user-a',
      name: 'reading',
      pinned: true,
      sortOrder: 2,
      color: '#c45c26'
    })

    const record = await selectTagById(db, parseUserId('user-a'), id)

    expect(record).toEqual({
      id,
      name: 'reading',
      pinned: true,
      sortOrder: 2,
      color: '#c45c26'
    })
  })

  test('他人のタグは null を返す', async () => {
    const db = await createMemoryDb()
    await seedUser(db, 'user-a')
    await seedUser(db, 'user-b')
    const id = await seedTag(db, { userId: 'user-b', name: 'secret' })

    await expect(selectTagById(db, parseUserId('user-a'), id)).resolves.toBeNull()
  })

  test('存在しない id は null を返す', async () => {
    const db = await createMemoryDb()
    await seedUser(db, 'user-a')

    await expect(selectTagById(db, parseUserId('user-a'), 999)).resolves.toBeNull()
  })
})
