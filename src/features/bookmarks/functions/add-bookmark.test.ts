import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { addBookmarkInputSchema } from './add-bookmark'

describe('addBookmarkInputSchema', () => {
  test('tags 配列を受け付ける', async () => {
    const result = await v.parseAsync(addBookmarkInputSchema, {
      url: 'https://example.com',
      title: 'Example Site',
      note: null,
      tags: [1, 2, 3]
    })

    expect(result.tags).toEqual([1, 2, 3])
  })

  test('tags がないと失敗', async () => {
    await expect(
      v.parseAsync(addBookmarkInputSchema, {
        url: 'https://example.com',
        title: 'Example Site',
        note: null
      })
    ).rejects.toThrow()
  })
})
