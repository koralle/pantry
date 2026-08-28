import { afterEach, describe, expect, test } from 'vitest'

import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import {
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
    rememberBookmarkListScroll(bookmarkListSearchIdentity(defaultSearch), 640)

    expect(consumeBookmarkListScroll(bookmarkListSearchIdentity({ ...defaultSearch }))).toBe(640)
    expect(consumeBookmarkListScroll(bookmarkListSearchIdentity({ ...defaultSearch }))).toBeNull()
  })

  test('条件が変わった一覧にはスクロール位置を渡さない', () => {
    rememberBookmarkListScroll(bookmarkListSearchIdentity(defaultSearch), 640)

    expect(
      consumeBookmarkListScroll(
        bookmarkListSearchIdentity({
          q: 'react',
          tagMode: 'and',
          sort: 'newest'
        })
      )
    ).toBeNull()
  })

  test('タグ名のカンマとタグ配列の区切りを同一条件として扱わない', () => {
    const commaInName = bookmarkListSearchIdentity({
      tags: ['a,b'],
      tagMode: 'and',
      sort: 'newest'
    })
    const twoTags = bookmarkListSearchIdentity({
      tags: ['a', 'b'],
      tagMode: 'and',
      sort: 'newest'
    })

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
    expect(bookmarkListSearchIdentity({ tags: ['a', 'b'], tagMode: 'and', sort: 'newest' })).toBe(
      bookmarkListSearchIdentity({ tags: ['a', 'b'], tagMode: 'and', sort: 'newest' })
    )
    expect(
      bookmarkListSearchIdentity({ tags: ['a', 'b'], tagMode: 'and', sort: 'newest' })
    ).not.toBe(bookmarkListSearchIdentity({ tags: ['b', 'a'], tagMode: 'and', sort: 'newest' }))
    expect(bookmarkListSearchIdentity({ tagMode: 'and', sort: 'newest' })).not.toBe(
      bookmarkListSearchIdentity({ tags: [], tagMode: 'and', sort: 'newest' })
    )
  })

  test('ルーターの scroll restoration は一覧 pathname では動かさない', () => {
    expect(shouldRestoreRouterScroll({ pathname: '/' })).toBe(false)
    expect(shouldRestoreRouterScroll({ pathname: '/bookmarks/new' })).toBe(true)
    expect(shouldRestoreRouterScroll({ pathname: '/tags' })).toBe(true)
  })
})
