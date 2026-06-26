import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { updateBookmarkInputSchema } from './bookmark.schema'

describe('updateBookmarkInputSchema', () => {
  test('accepts valid input', async () => {
    const result = await v.parseAsync(updateBookmarkInputSchema, {
      id: 'test-bookmark-id',
      url: 'https://example.com',
      title: 'Example Site',
      note: 'memo'
    })

    expect(result).toStrictEqual({
      id: 'test-bookmark-id',
      url: 'https://example.com',
      title: 'Example Site',
      note: 'memo'
    })
  })

  test('accepts null note', async () => {
    const result = await v.parseAsync(updateBookmarkInputSchema, {
      id: 'test-bookmark-id',
      url: 'https://example.com',
      title: 'Example Site',
      note: null
    })

    expect(result.note).toBeNull()
  })

  test('rejects invalid url', async () => {
    await expect(
      v.parseAsync(updateBookmarkInputSchema, {
        id: 'test-bookmark-id',
        url: 'not-a-url',
        title: 'Example Site',
        note: null
      })
    ).rejects.toThrow()
  })

  test('accepts empty title', async () => {
    const result = await v.parseAsync(updateBookmarkInputSchema, {
      id: 'test-bookmark-id',
      url: 'https://example.com',
      title: '',
      note: null
    })

    expect(result.title).toBe('')
  })
})
