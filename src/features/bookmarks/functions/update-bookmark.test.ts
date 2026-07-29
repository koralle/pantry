import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { updateBookmarkInputSchema } from './update-bookmark'

describe('updateBookmarkInputSchema', () => {
  test('accepts valid input', async () => {
    const result = await v.parseAsync(updateBookmarkInputSchema, {
      id: 'test-bookmark-id',
      url: 'https://example.com',
      title: 'Example Site',
      note: 'memo',
      tags: []
    })

    expect(result).toStrictEqual({
      id: 'test-bookmark-id',
      url: 'https://example.com',
      title: 'Example Site',
      note: 'memo',
      tags: []
    })
  })

  test('accepts null note', async () => {
    const result = await v.parseAsync(updateBookmarkInputSchema, {
      id: 'test-bookmark-id',
      url: 'https://example.com',
      title: 'Example Site',
      note: null,
      tags: []
    })

    expect(result.note).toBeNull()
  })

  test('rejects invalid url', async () => {
    await expect(
      v.parseAsync(updateBookmarkInputSchema, {
        id: 'test-bookmark-id',
        url: 'not-a-url',
        title: 'Example Site',
        note: null,
        tags: []
      })
    ).rejects.toThrow()
  })

  test('accepts empty title', async () => {
    const result = await v.parseAsync(updateBookmarkInputSchema, {
      id: 'test-bookmark-id',
      url: 'https://example.com',
      title: '',
      note: null,
      tags: []
    })

    expect(result.title).toBe('')
  })
})

describe('updateBookmarkInputSchema', () => {
  test('tags 配列を受け付ける', async () => {
    const result = await v.parseAsync(updateBookmarkInputSchema, {
      id: 'test-bookmark-id',
      url: 'https://example.com',
      title: 'Example Site',
      note: null,
      tags: [1]
    })

    expect(result.tags).toEqual([1])
  })
})
