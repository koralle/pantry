import { describe, expect, test, vi } from 'vitest'

import type { AppDb } from '../../../db/app-db'
import { loadBookmarkForEdit } from './load-bookmark-for-edit'
import {
  bookmarkId,
  bookmarkNote,
  bookmarkTitle,
  bookmarkUrl,
  createThenableChain,
  userId
} from './test-helpers'

describe('loadBookmarkForEdit', () => {
  test('returns Ok(BookmarkEditorData) when bookmark exists', async () => {
    const id = bookmarkId()
    const actor = userId('user-1')

    const select = vi
      .fn()
      .mockReturnValueOnce(
        createThenableChain([
          {
            id,
            url: 'https://example.com',
            title: 'Example',
            note: 'memo'
          }
        ])
      )
      .mockReturnValueOnce(createThenableChain([{ tagId: 1 }, { tagId: 2 }]))

    const db = { select } as unknown as AppDb

    const result = await loadBookmarkForEdit({
      db,
      actorId: actor,
      bookmarkId: id
    })

    expect(result).toStrictEqual({
      ok: true,
      value: {
        bookmarkId: id,
        url: bookmarkUrl('https://example.com'),
        title: bookmarkTitle('Example'),
        note: bookmarkNote('memo'),
        tagIds: [1, 2]
      }
    })
  })

  test('returns Err(bookmark-not-found) when bookmark is missing', async () => {
    const select = vi.fn().mockReturnValue(createThenableChain([]))
    const db = { select } as unknown as AppDb

    const result = await loadBookmarkForEdit({
      db,
      actorId: userId('user-1'),
      bookmarkId: bookmarkId()
    })

    expect(result).toStrictEqual({
      ok: false,
      error: { code: 'bookmark-not-found' }
    })
  })

  test('normalizes blank note to null and allows empty tagIds', async () => {
    const id = bookmarkId()
    const select = vi
      .fn()
      .mockReturnValueOnce(
        createThenableChain([
          {
            id,
            url: 'https://example.com/path',
            title: '  Title  ',
            note: '   '
          }
        ])
      )
      .mockReturnValueOnce(createThenableChain([]))

    const result = await loadBookmarkForEdit({
      db: { select } as unknown as AppDb,
      actorId: userId('user-1'),
      bookmarkId: id
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.note).toBeNull()
      expect(result.value.title).toBe('  Title  ')
      expect(result.value.tagIds).toStrictEqual([])
    }
  })
})
