import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { bookmarkSearchSchema } from './bookmark-search'

describe('bookmarkSearchSchema', () => {
  test('default values', async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, {})
    expect(result).toStrictEqual({
      limit: 50,
      offset: 0,
      view: 'entrance',
      tagMode: 'and',
      sort: 'newest'
    })
  })

  test('defaults view to entrance', async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, {})
    expect(result.view).toBe('entrance')
    expect(result.tagMode).toBe('and')
    expect(result.sort).toBe('newest')
  })

  test('parses view=list', async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, { view: 'list' })
    expect(result.view).toBe('list')
  })

  test('rejects invalid view', async () => {
    await expect(v.parseAsync(bookmarkSearchSchema, { view: 'grid' })).rejects.toThrow()
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
      view: 'entrance',
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
