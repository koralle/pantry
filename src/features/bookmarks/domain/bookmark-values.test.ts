import { uuidv7 } from 'uuidv7'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from './bookmark-values'

describe('bookmarkIdSchema', () => {
  test('accepts a UUID v7', () => {
    const id = uuidv7()
    const result = v.safeParse(bookmarkIdSchema, id)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output).toBe(id)
    }
  })

  test('rejects a non-v7 UUID', () => {
    const result = v.safeParse(bookmarkIdSchema, '550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(false)
  })
})

describe('bookmarkUrlSchema', () => {
  test('accepts http and https URLs', () => {
    expect(v.safeParse(bookmarkUrlSchema, 'https://example.com').success).toBe(true)
    expect(v.safeParse(bookmarkUrlSchema, 'http://example.com/path').success).toBe(true)
  })

  test('rejects non-http(s) URLs', () => {
    expect(v.safeParse(bookmarkUrlSchema, 'ftp://example.com').success).toBe(false)
    expect(v.safeParse(bookmarkUrlSchema, 'not-a-url').success).toBe(false)
  })

  test('reports a Japanese message for malformed URLs', () => {
    const result = v.safeParse(bookmarkUrlSchema, 'foo')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues[0]?.message).toBe('有効なURLを入力してください')
    }
  })

  test('does not canonicalize', () => {
    const result = v.safeParse(bookmarkUrlSchema, 'https://Example.COM/Path/')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output).toBe('https://Example.COM/Path/')
    }
  })
})

describe('bookmarkTitleSchema', () => {
  test('rejects empty or whitespace-only titles', () => {
    expect(v.safeParse(bookmarkTitleSchema, '').success).toBe(false)
    expect(v.safeParse(bookmarkTitleSchema, '   ').success).toBe(false)
  })

  test('keeps leading and trailing whitespace when content exists', () => {
    const result = v.safeParse(bookmarkTitleSchema, '  Hello  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output).toBe('  Hello  ')
    }
  })
})

describe('bookmarkNoteSchema', () => {
  test('normalizes empty and whitespace-only to null', () => {
    expect(v.safeParse(bookmarkNoteSchema, '').output).toBeNull()
    expect(v.safeParse(bookmarkNoteSchema, '   ').output).toBeNull()
    expect(v.safeParse(bookmarkNoteSchema, null).output).toBeNull()
  })

  test('keeps non-empty notes', () => {
    const result = v.safeParse(bookmarkNoteSchema, 'memo')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output).toBe('memo')
    }
  })
})
