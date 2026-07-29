import { describe, expect, test } from 'vitest'

import { normalizeListQuery } from './normalize-bookmark-list-query'

describe('normalizeListQuery', () => {
  test('trims q and drops empty', () => {
    expect(
      normalizeListQuery({
        q: '  ',
        tagMode: 'and',
        sort: 'newest',
        limit: 50,
        offset: 0
      }).q
    ).toBeUndefined()
  })

  test('normalizes tag names', () => {
    expect(
      normalizeListQuery({
        tagNames: [' React ', 'react', 'TS'],
        tagMode: 'or',
        sort: 'updated',
        limit: 50,
        offset: 0
      }).tagNames
    ).toEqual(['react', 'ts'])
  })
})
