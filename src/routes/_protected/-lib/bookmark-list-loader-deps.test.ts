import { describe, expect, test } from 'vitest'

import type { BookmarkSearchSchema } from '../../../features/navigation/lib/bookmark-search'
import { bookmarkListLoaderDeps } from './bookmark-list-loader-deps'

const baseSearch = {
  tagMode: 'and',
  sort: 'newest'
} as const satisfies BookmarkSearchSchema

describe('bookmarkListLoaderDeps', () => {
  test('includes filter/sort fields used by the list query', () => {
    const deps = bookmarkListLoaderDeps({
      ...baseSearch,
      q: 'react',
      tags: ['frontend'],
      tagMode: 'or',
      sort: 'updated'
    })

    expect(deps).toStrictEqual({
      q: 'react',
      tags: ['frontend'],
      tagMode: 'or',
      sort: 'updated'
    })
  })

  test('omits paging fields so the loader does not depend on cursor', () => {
    const deps = bookmarkListLoaderDeps(baseSearch)
    expect(deps).not.toHaveProperty('limit')
    expect(deps).not.toHaveProperty('offset')
    expect(deps).not.toHaveProperty('cursor')
    expect(deps).not.toHaveProperty('view')
  })
})
