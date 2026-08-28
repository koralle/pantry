import { describe, expect, test } from 'vitest'

import { normalizeListQuery } from './normalize-bookmark-list-query'

describe('normalizeListQuery', () => {
  test('trims q and drops empty', () => {
    expect(
      normalizeListQuery({
        q: '  ',
        tagMode: 'and',
        sort: 'newest'
      }).q
    ).toBeUndefined()
  })

  test('normalizes tag names', () => {
    expect(
      normalizeListQuery({
        tagNames: [' React ', 'react', 'TS', 'TypeScript'],
        tagMode: 'or',
        sort: 'updated'
      }).tagNames
    ).toEqual(['react', 'ts', 'typescript'])
  })

  test('collapses tag names that differ only by Unicode composition', () => {
    expect(
      normalizeListQuery({
        tagNames: ['ハ\u309A', 'パ'],
        tagMode: 'or',
        sort: 'updated'
      }).tagNames
    ).toEqual(['パ'])
  })
})
