import { describe, expect, test } from 'vitest'

import { defaultBookmarkSearch } from './bookmark-search'
import {
  allShelfSearch,
  chromeListSearch,
  detailSearchFromList,
  listSearchFromDetail,
  resolveChromeListSearch,
  tagShelfSearch
} from './bookmark-search-builders'

describe('shelf filter search', () => {
  test('all keeps q and clears tags', () => {
    const next = allShelfSearch({
      ...defaultBookmarkSearch,
      q: 'react',
      tags: ['frontend'],
      tagMode: 'or',
      sort: 'updated'
    })

    expect(next).toStrictEqual({
      q: 'react',
      tagMode: 'or',
      sort: 'updated'
    })
  })

  test('tag keeps q and writes the normalized name into search', () => {
    const next = tagShelfSearch('TypeScript', {
      ...defaultBookmarkSearch,
      q: 'react',
      tags: ['frontend', 'docs'],
      sort: 'updated'
    })

    expect(next).toStrictEqual({
      q: 'react',
      tags: ['typescript'],
      tagMode: 'and',
      sort: 'updated'
    })
  })
})

describe('chromeListSearch', () => {
  test('prefers the list search when present', () => {
    const index = {
      ...defaultBookmarkSearch,
      q: 'react',
      tags: ['frontend']
    }

    expect(chromeListSearch(index, [{ tags: ['ignored'] }])).toStrictEqual(index)
  })

  test('uses tags from a child route when the list is not mounted', () => {
    expect(
      chromeListSearch(undefined, [{ tags: ['frontend'] }, { tags: ['other'] }])
    ).toStrictEqual({
      ...defaultBookmarkSearch,
      tags: ['frontend']
    })
  })

  test('returns undefined when no list and no tags', () => {
    expect(chromeListSearch(undefined, [{}, undefined])).toBeUndefined()
  })
})

describe('resolveChromeListSearch', () => {
  test('keeps remembered list search when the index route is unmounted', () => {
    const remembered = {
      ...defaultBookmarkSearch,
      q: 'react',
      tags: ['frontend']
    }

    expect(resolveChromeListSearch(undefined, remembered, [{ tags: ['other'] }])).toStrictEqual(
      remembered
    )
  })

  test('falls back to child-route tags when nothing is remembered', () => {
    expect(resolveChromeListSearch(undefined, undefined, [{ tags: ['frontend'] }])).toStrictEqual({
      ...defaultBookmarkSearch,
      tags: ['frontend']
    })
  })
})

describe('detail search round-trip', () => {
  test('non-default list conditions travel to detail and back', () => {
    const current = {
      ...defaultBookmarkSearch,
      q: 'react',
      tags: ['frontend'],
      tagMode: 'or' as const,
      sort: 'updated' as const
    }

    expect(listSearchFromDetail(detailSearchFromList(current))).toStrictEqual(current)
  })
})
