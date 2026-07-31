import { describe, expect, test, vi } from 'vitest'

import type { AppDb } from '../../../db/app-db'
import { executeUpdateBookmark } from './execute-update-bookmark'
import {
  bookmarkId,
  bookmarkNote,
  bookmarkTitle,
  bookmarkUrl,
  createThenableChain,
  tagId,
  userId
} from './test-helpers'

function createCommand(
  overrides: Partial<{
    bookmarkId: ReturnType<typeof bookmarkId>
    url: ReturnType<typeof bookmarkUrl>
    title: ReturnType<typeof bookmarkTitle>
    note: ReturnType<typeof bookmarkNote>
    tagIds: ReturnType<typeof tagId>[]
  }> = {}
) {
  return {
    bookmarkId: overrides.bookmarkId ?? bookmarkId(),
    url: overrides.url ?? bookmarkUrl('https://example.com'),
    title: overrides.title ?? bookmarkTitle('Example'),
    note: overrides.note ?? bookmarkNote(null),
    tagIds: overrides.tagIds ?? []
  }
}

describe('executeUpdateBookmark', () => {
  test('returns Ok(bookmarkId) and runs writes inside a transaction', async () => {
    const id = bookmarkId()
    const actor = userId('user-1')
    const command = createCommand({ bookmarkId: id, tagIds: [tagId(1)] })

    const select = vi
      .fn()
      // Existing bookmark
      .mockReturnValueOnce(createThenableChain([{ id, deletedAt: null }]))
      // Duplicate URL check
      .mockReturnValueOnce(createThenableChain([]))
      // Tag ownership
      .mockReturnValueOnce(createThenableChain([{ id: 1, userId: actor }]))

    const update = vi.fn().mockReturnValue(createThenableChain(undefined))
    const del = vi.fn().mockReturnValue(createThenableChain(undefined))
    const insert = vi.fn().mockReturnValue(createThenableChain(undefined))

    const tx = { select, update, delete: del, insert }
    const transaction = vi.fn(async (fn: (txDb: typeof tx) => Promise<unknown>) => fn(tx))
    const db = { transaction } as unknown as AppDb

    const result = await executeUpdateBookmark({ db, actorId: actor, command })

    expect(result).toStrictEqual({ ok: true, value: { bookmarkId: id } })
    expect(transaction).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalled()
    expect(del).toHaveBeenCalled()
    expect(insert).toHaveBeenCalled()
  })

  test('returns Err(bookmark-not-found) when bookmark is missing', async () => {
    const select = vi.fn().mockReturnValue(createThenableChain([]))
    const tx = { select, update: vi.fn(), delete: vi.fn(), insert: vi.fn() }
    const db = {
      transaction: vi.fn(async (fn: (txDb: typeof tx) => Promise<unknown>) => fn(tx))
    } as unknown as AppDb

    const result = await executeUpdateBookmark({
      db,
      actorId: userId('user-1'),
      command: createCommand()
    })

    expect(result).toStrictEqual({
      ok: false,
      error: { code: 'bookmark-not-found' }
    })
  })

  test('returns Err(duplicate-url) when another bookmark has the same url', async () => {
    const id = bookmarkId()
    const select = vi
      .fn()
      .mockReturnValueOnce(createThenableChain([{ id, deletedAt: null }]))
      .mockReturnValueOnce(createThenableChain([{ id: bookmarkId() }]))

    const tx = { select, update: vi.fn(), delete: vi.fn(), insert: vi.fn() }
    const db = {
      transaction: vi.fn(async (fn: (txDb: typeof tx) => Promise<unknown>) => fn(tx))
    } as unknown as AppDb

    const result = await executeUpdateBookmark({
      db,
      actorId: userId('user-1'),
      command: createCommand({ bookmarkId: id })
    })

    expect(result).toStrictEqual({
      ok: false,
      error: { code: 'duplicate-url' }
    })
  })

  test('returns Err(duplicate-tag-id) when tagIds contain duplicates', async () => {
    const id = bookmarkId()
    const select = vi
      .fn()
      .mockReturnValueOnce(createThenableChain([{ id, deletedAt: null }]))
      .mockReturnValueOnce(createThenableChain([]))

    const tx = { select, update: vi.fn(), delete: vi.fn(), insert: vi.fn() }
    const db = {
      transaction: vi.fn(async (fn: (txDb: typeof tx) => Promise<unknown>) => fn(tx))
    } as unknown as AppDb

    const result = await executeUpdateBookmark({
      db,
      actorId: userId('user-1'),
      command: createCommand({ bookmarkId: id, tagIds: [tagId(1), tagId(1)] })
    })

    expect(result).toStrictEqual({
      ok: false,
      error: { code: 'duplicate-tag-id', field: 'tags', tagId: 1 }
    })
  })

  test('returns Err(invalid-tag / tag-not-found) when a tag is missing', async () => {
    const id = bookmarkId()
    const missing = tagId(99)
    const select = vi
      .fn()
      .mockReturnValueOnce(createThenableChain([{ id, deletedAt: null }]))
      .mockReturnValueOnce(createThenableChain([]))
      .mockReturnValueOnce(createThenableChain([]))

    const tx = { select, update: vi.fn(), delete: vi.fn(), insert: vi.fn() }
    const db = {
      transaction: vi.fn(async (fn: (txDb: typeof tx) => Promise<unknown>) => fn(tx))
    } as unknown as AppDb

    const result = await executeUpdateBookmark({
      db,
      actorId: userId('user-1'),
      command: createCommand({ bookmarkId: id, tagIds: [missing] })
    })

    expect(result).toStrictEqual({
      ok: false,
      error: {
        code: 'invalid-tag',
        field: 'tags',
        cause: { code: 'tag-not-found', tagId: missing }
      }
    })
  })

  test('returns Err(invalid-tag / tag-not-owned) when a tag belongs to another user', async () => {
    const id = bookmarkId()
    const ownedByOther = tagId(2)
    const select = vi
      .fn()
      .mockReturnValueOnce(createThenableChain([{ id, deletedAt: null }]))
      .mockReturnValueOnce(createThenableChain([]))
      .mockReturnValueOnce(createThenableChain([{ id: 2, userId: 'other-user' }]))

    const tx = { select, update: vi.fn(), delete: vi.fn(), insert: vi.fn() }
    const db = {
      transaction: vi.fn(async (fn: (txDb: typeof tx) => Promise<unknown>) => fn(tx))
    } as unknown as AppDb

    const result = await executeUpdateBookmark({
      db,
      actorId: userId('user-1'),
      command: createCommand({ bookmarkId: id, tagIds: [ownedByOther] })
    })

    expect(result).toStrictEqual({
      ok: false,
      error: {
        code: 'invalid-tag',
        field: 'tags',
        cause: { code: 'tag-not-owned', tagId: ownedByOther }
      }
    })
  })

  test('maps unique constraint failures to Err(duplicate-url)', async () => {
    const id = bookmarkId()
    const select = vi
      .fn()
      .mockReturnValueOnce(createThenableChain([{ id, deletedAt: null }]))
      .mockReturnValueOnce(createThenableChain([]))

    const update = vi.fn().mockReturnValue({
      set: () => ({
        where: () =>
          Promise.reject(Object.assign(new Error('UNIQUE'), { code: 'SQLITE_CONSTRAINT_UNIQUE' }))
      })
    })

    const tx = { select, update, delete: vi.fn(), insert: vi.fn() }
    const db = {
      transaction: vi.fn(async (fn: (txDb: typeof tx) => Promise<unknown>) => fn(tx))
    } as unknown as AppDb

    const result = await executeUpdateBookmark({
      db,
      actorId: userId('user-1'),
      command: createCommand({ bookmarkId: id })
    })

    expect(result).toStrictEqual({
      ok: false,
      error: { code: 'duplicate-url' }
    })
  })

  test('maps unexpected write failures to Err(unexpected-error)', async () => {
    const id = bookmarkId()
    const select = vi
      .fn()
      .mockReturnValueOnce(createThenableChain([{ id, deletedAt: null }]))
      .mockReturnValueOnce(createThenableChain([]))

    const update = vi.fn().mockReturnValue({
      set: () => ({
        where: () => Promise.reject(new Error('disk full'))
      })
    })

    const tx = { select, update, delete: vi.fn(), insert: vi.fn() }
    const db = {
      transaction: vi.fn(async (fn: (txDb: typeof tx) => Promise<unknown>) => fn(tx))
    } as unknown as AppDb

    const result = await executeUpdateBookmark({
      db,
      actorId: userId('user-1'),
      command: createCommand({ bookmarkId: id })
    })

    expect(result).toStrictEqual({
      ok: false,
      error: { code: 'unexpected-error' }
    })
  })
})
