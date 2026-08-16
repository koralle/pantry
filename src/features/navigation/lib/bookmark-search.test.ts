import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { bookmarkSearchSchema } from './bookmark-search'

describe('bookmarkSearchSchema', () => {
  test('default values', async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, {})
    expect(result).toStrictEqual({
      limit: 50,
      offset: 0,
      tagMode: 'and',
      sort: 'newest'
    })
  })

  test('ignores legacy view query and lands on list defaults', async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, { view: 'entrance' })
    expect(result).toStrictEqual({
      limit: 50,
      offset: 0,
      tagMode: 'and',
      sort: 'newest'
    })
  })

  test('parses all fields', async () => {
    const result = await v.parse(bookmarkSearchSchema, {
      q: 'react',
      tags: ['frontend', 'typescript'],
      tagMode: 'or',
      sort: 'updated'
    })
    expect(result).toStrictEqual({
      limit: 50,
      offset: 0,
      q: 'react',
      tags: ['frontend', 'typescript'],
      tagMode: 'or',
      sort: 'updated'
    })
  })

  test('rejects invalid tagMode', async () => {
    await expect(v.parseAsync(bookmarkSearchSchema, { tagMode: 'xor' })).rejects.toThrow()
  })

  test('rejects invalid sort', async () => {
    await expect(v.parseAsync(bookmarkSearchSchema, { sort: 'oldest' })).rejects.toThrow()
  })
})
