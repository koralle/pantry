import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { bookmarkFormSchema } from './schema'

describe('bookmarkFormSchema', () => {
  test('parses URL and title into branded values', () => {
    const result = v.safeParse(bookmarkFormSchema, {
      url: 'https://example.com/article',
      title: 'Example Article',
      note: 'memo'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output.url).toBe('https://example.com/article')
      expect(result.output.title).toBe('Example Article')
      expect(result.output.note).toBe('memo')
    }
  })

  test('normalizes an empty note to null', () => {
    const result = v.safeParse(bookmarkFormSchema, {
      url: 'https://example.com/article',
      title: 'Example Article',
      note: ''
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output.note).toBeNull()
    }
  })
})
