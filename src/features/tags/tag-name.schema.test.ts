import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { tagNameSchema } from './tag-name.schema'

describe('tagNameSchema', () => {
  test('trims and lowercases the input', () => {
    const result = v.parse(tagNameSchema, '  TypeScript  ')
    expect(result).toBe('typescript')
  })

  test('accepts a 32-character name', () => {
    const name = 'a'.repeat(32)
    const result = v.parse(tagNameSchema, name)
    expect(result).toBe(name)
  })

  test('rejects an empty string after trimming', () => {
    expect(() => v.parse(tagNameSchema, '   ')).toThrow()
  })

  test('rejects a name longer than 32 characters', () => {
    expect(() => v.parse(tagNameSchema, 'a'.repeat(33))).toThrow()
  })
})
