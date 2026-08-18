import { describe, expect, test } from 'vitest'

import type { BookmarkSearchSchema } from '../../../features/navigation/lib/bookmark-search'
import { bookmarkListLoaderDeps } from './bookmark-list-loader-deps'

const baseSearch = {
  limit: 50,
  offset: 0,
  tagMode: 'and',
  sort: 'newest'
} as const satisfies BookmarkSearchSchema

describe('bookmarkListLoaderDeps', () => {
  test('includes filter/sort fields used by fetchBookmarks', () => {
    const deps = bookmarkListLoaderDeps({
      ...baseSearch,
      q: 'react',
      tags: ['frontend'],
      tagMode: 'or',
      sort: 'updated',
      limit: 20,
      offset: 40
    })

    expect(deps).toStrictEqual({
      q: 'react',
      tags: ['frontend'],
      tagMode: 'or',
      sort: 'updated',
      limit: 20,
      offset: 40
    })
  })

  test('omits view so the loader always fetches the list', () => {
    const deps = bookmarkListLoaderDeps(baseSearch)
    expect(deps).not.toHaveProperty('view')
  })
})
