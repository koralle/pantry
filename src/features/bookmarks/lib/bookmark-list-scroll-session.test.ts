import { afterEach, describe, expect, test } from 'vitest'

import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import {
  bookmarkListSearchEquals,
  bookmarkListSearchIdentity,
  clearBookmarkListScroll,
  consumeBookmarkListScroll,
  rememberBookmarkListScroll,
  shouldRestoreRouterScroll
} from './bookmark-list-scroll-session'

const defaultSearch = {
  tagMode: 'and',
  sort: 'newest'
} as const satisfies BookmarkSearchSchema

describe('bookmark list scroll session', () => {
  afterEach(() => {
    clearBookmarkListScroll()
  })

  test('同じ一覧条件なら保存したスクロール位置を一度だけ返す', () => {
    rememberBookmarkListScroll(defaultSearch, 640)

    expect(consumeBookmarkListScroll({ ...defaultSearch })).toBe(640)
    expect(consumeBookmarkListScroll({ ...defaultSearch })).toBeNull()
  })

  test('条件が変わった一覧にはスクロール位置を渡さない', () => {
    rememberBookmarkListScroll(defaultSearch, 640)

    expect(
      consumeBookmarkListScroll({
        q: 'react',
        tagMode: 'and',
        sort: 'newest'
      })
    ).toBeNull()
  })

  test('タグ名のカンマとタグ配列の区切りを同一条件として扱わない', () => {
    const commaInName = {
      tags: ['a,b'],
      tagMode: 'and',
      sort: 'newest'
    } as const satisfies BookmarkSearchSchema
    const twoTags = {
      tags: ['a', 'b'],
      tagMode: 'and',
      sort: 'newest'
    } as const satisfies BookmarkSearchSchema

    rememberBookmarkListScroll(commaInName, 640)

    expect(consumeBookmarkListScroll(twoTags)).toBeNull()
    expect(consumeBookmarkListScroll(commaInName)).toBe(640)
  })

  test('一覧 identity はタグ名のカンマと配列区切りを衝突させない', () => {
    expect(
      bookmarkListSearchIdentity({
        tags: ['a,b'],
        tagMode: 'and',
        sort: 'newest'
      })
    ).not.toBe(
      bookmarkListSearchIdentity({
        tags: ['a', 'b'],
        tagMode: 'and',
        sort: 'newest'
      })
    )
  })

  test('タグ配列は要素と並びが同じときだけ同一条件', () => {
    expect(
      bookmarkListSearchEquals(
        { tags: ['a', 'b'], tagMode: 'and', sort: 'newest' },
        { tags: ['a', 'b'], tagMode: 'and', sort: 'newest' }
      )
    ).toBe(true)
    expect(
      bookmarkListSearchEquals(
        { tags: ['a', 'b'], tagMode: 'and', sort: 'newest' },
        { tags: ['b', 'a'], tagMode: 'and', sort: 'newest' }
      )
    ).toBe(false)
    expect(
      bookmarkListSearchEquals(
        { tagMode: 'and', sort: 'newest' },
        { tags: [], tagMode: 'and', sort: 'newest' }
      )
    ).toBe(false)
  })

  test('ルーターの scroll restoration は一覧 pathname では動かさない', () => {
    expect(shouldRestoreRouterScroll({ pathname: '/' })).toBe(false)
    expect(shouldRestoreRouterScroll({ pathname: '/bookmarks/new' })).toBe(true)
    expect(shouldRestoreRouterScroll({ pathname: '/tags' })).toBe(true)
  })
})
