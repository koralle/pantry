import { describe, expect, test } from 'vitest'

import { selectTags } from './select-tags'
import { createMemoryDb, parseUserId, seedTag, seedUser } from './test-helpers'

describe('selectTags', () => {
  test('limit と offset を適用する', async () => {
    const db = await createMemoryDb()
    await seedUser(db, 'user-a')
    await seedTag(db, { userId: 'user-a', name: 'alpha' })
    await seedTag(db, { userId: 'user-a', name: 'beta' })
    await seedTag(db, { userId: 'user-a', name: 'gamma' })

    const rows = await selectTags(db, parseUserId('user-a'), { limit: 2, offset: 1 })

    expect(rows.map((row) => row.name)).toEqual(['beta', 'gamma'])
  })

  test('行は id と name だけの写像で、本人の行だけを返す', async () => {
    const db = await createMemoryDb()
    await seedUser(db, 'user-a')
    await seedUser(db, 'user-b')
    const alphaId = await seedTag(db, { userId: 'user-a', name: 'Alpha' })
    await seedTag(db, { userId: 'user-b', name: 'secret' })

    const rows = await selectTags(db, parseUserId('user-a'), { limit: 1000, offset: 0 })

    expect(rows).toEqual([{ id: alphaId, name: 'Alpha' }])
  })
})
