import { describe, expect, test } from 'vitest'

import type { BookmarkSearchSchema } from '../../../features/navigation/lib/bookmark-search'
import { bookmarkListLoaderDeps } from './bookmark-list-loader-deps'

const baseSearch = {
  limit: 50,
  offset: 0,
  view: 'entrance',
  tagMode: 'and',
  sort: 'newest'
} as const satisfies BookmarkSearchSchema

describe('bookmarkListLoaderDeps', () => {
  test('includes view so entrance → list invalidates the loader', () => {
    const entrance = bookmarkListLoaderDeps(baseSearch)
    const list = bookmarkListLoaderDeps({ ...baseSearch, view: 'list' })

    expect(entrance.view).toBe('entrance')
    expect(list.view).toBe('list')
    expect(entrance).not.toStrictEqual(list)
  })

  test('includes filter/sort fields used by fetchBookmarks', () => {
    const deps = bookmarkListLoaderDeps({
      ...baseSearch,
      view: 'list',
      q: 'react',
      tags: ['frontend'],
      tagMode: 'or',
      sort: 'updated',
      limit: 20,
      offset: 40
    })

    expect(deps).toStrictEqual({
      view: 'list',
      q: 'react',
      tags: ['frontend'],
      tagMode: 'or',
      sort: 'updated',
      limit: 20,
      offset: 40
    })
  })
})
