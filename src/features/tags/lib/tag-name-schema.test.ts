import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { tagNameSchema } from './tag-name-schema'

describe('tagNameSchema', () => {
  test('returns display and normalized from mixed-case input', () => {
    expect(v.parse(tagNameSchema, '  TypeScript  ')).toEqual({
      display: 'TypeScript',
      normalized: 'typescript'
    })
  })

  test('accepts a 32-character display name', () => {
    const name = 'A'.repeat(32)
    expect(v.parse(tagNameSchema, name)).toEqual({
      display: name,
      normalized: 'a'.repeat(32)
    })
  })

  test('rejects an empty string after trimming', () => {
    expect(() => v.parse(tagNameSchema, '   ')).toThrow()
  })

  test('rejects a name longer than 32 characters', () => {
    expect(() => v.parse(tagNameSchema, 'a'.repeat(33))).toThrow()
  })
})
