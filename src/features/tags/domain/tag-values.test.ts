import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { tagIdSchema, tagNameSchema } from './tag-values'

describe('tagIdSchema', () => {
  test('accepts positive integers', () => {
    const result = v.safeParse(tagIdSchema, 1)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output).toBe(1)
    }
  })

  test('rejects zero and negative numbers', () => {
    expect(v.safeParse(tagIdSchema, 0).success).toBe(false)
    expect(v.safeParse(tagIdSchema, -1).success).toBe(false)
  })
})

describe('tagNameSchema', () => {
  test('trims and lowercases the input', () => {
    const result = v.safeParse(tagNameSchema, '  TypeScript  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output).toBe('typescript')
    }
  })

  test('accepts a 32-character name', () => {
    const name = 'a'.repeat(32)
    expect(v.safeParse(tagNameSchema, name).success).toBe(true)
  })

  test('rejects empty string after trimming', () => {
    expect(v.safeParse(tagNameSchema, '   ').success).toBe(false)
  })

  test('rejects a name longer than 32 characters', () => {
    expect(v.safeParse(tagNameSchema, 'a'.repeat(33)).success).toBe(false)
  })
})
