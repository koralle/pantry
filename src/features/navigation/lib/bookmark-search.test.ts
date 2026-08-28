import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import type { BookmarkDetailSearch } from './bookmark-search'
import { bookmarkDetailSearchSchema, bookmarkSearchSchema } from './bookmark-search'

describe('bookmarkSearchSchema', () => {
  test('default values', async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, {})
    expect(result).toStrictEqual({
      tagMode: 'and',
      sort: 'newest'
    })
  })

  test('ignores legacy view query and lands on list defaults', async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, { view: 'entrance' })
    expect(result).toStrictEqual({
      tagMode: 'and',
      sort: 'newest'
    })
  })

  test('strips legacy limit and offset without error', async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, {
      limit: 50,
      offset: 100,
      q: 'react'
    })
    expect(result).toStrictEqual({
      q: 'react',
      tagMode: 'and',
      sort: 'newest'
    })
    expect(result).not.toHaveProperty('limit')
    expect(result).not.toHaveProperty('offset')
  })

  test('detail search keeps list conditions without filling defaults', async () => {
    const result = await v.parseAsync(bookmarkDetailSearchSchema, {
      q: 'react',
      tagMode: 'or',
      sort: 'updated'
    })
    expect(result).toStrictEqual({
      q: 'react',
      tagMode: 'or',
      sort: 'updated'
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

  test('BookmarkDetailSearch は schema の出力型である', () => {
    const parsed: BookmarkDetailSearch = v.parse(bookmarkDetailSearchSchema, {
      q: 'react',
      tags: ['frontend'],
      tagMode: 'or',
      sort: 'updated'
    })
    expect(parsed).toStrictEqual({
      q: 'react',
      tags: ['frontend'],
      tagMode: 'or',
      sort: 'updated'
    })
  })
})
