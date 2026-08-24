import * as v from 'valibot'
import { afterEach, describe, expect, test } from 'vitest'

import { bookmarkIdSchema } from '../domain/bookmark-values'
import { selectBookmarkEditor } from './select-bookmark-editor'
import {
  closeMemoryClients,
  createMemoryDb,
  insertBookmarkRow,
  insertBookmarkTagRow,
  insertTagRow,
  insertUser
} from './test-helpers'

afterEach(async () => {
  await closeMemoryClients()
})

const actorId = 'user-a'
const targetId = '019fae92-3bb0-78cd-b488-65ce0e26a939'

describe('selectBookmarkEditor', () => {
  test('actor が所有する未削除 bookmark の編集用 projection を返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, actorId)
    await insertBookmarkRow(db, {
      id: targetId,
      userId: actorId,
      url: 'https://example.com/article',
      title: 'Article',
      note: 'memo'
    })
    const tag = await insertTagRow(db, actorId, 'work')
    await insertBookmarkTagRow(db, targetId, tag)

    const record = await selectBookmarkEditor(db, v.parse(v.string(), actorId) as never, targetId)

    expect(record).toStrictEqual({
      id: v.parse(bookmarkIdSchema, targetId),
      url: 'https://example.com/article',
      title: 'Article',
      note: 'memo',
      tagIds: [tag]
    })
  })

  test('対象なしは null を返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, actorId)

    expect(await selectBookmarkEditor(db, actorId as never, targetId)).toBeNull()
  })

  test('削除済み bookmark も null を返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, actorId)
    await insertBookmarkRow(db, {
      id: targetId,
      userId: actorId,
      url: 'https://example.com/gone',
      deletedAt: new Date()
    })

    expect(await selectBookmarkEditor(db, actorId as never, targetId)).toBeNull()
  })

  test('別 user の bookmark も null を返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-b')
    await insertBookmarkRow(db, {
      id: targetId,
      userId: 'user-b',
      url: 'https://example.com/theirs'
    })

    expect(await selectBookmarkEditor(db, actorId as never, targetId)).toBeNull()
  })
})
