import { afterEach, describe, expect, test } from 'vitest'

import {
  bookmarkListSearchKey,
  clearBookmarkListScroll,
  consumeBookmarkListScroll,
  rememberBookmarkListScroll
} from './bookmark-list-scroll-session'

describe('bookmark list scroll session', () => {
  afterEach(() => {
    clearBookmarkListScroll()
  })

  test('同じ一覧条件なら保存したスクロール位置を一度だけ返す', () => {
    const key = bookmarkListSearchKey({ tagMode: 'and', sort: 'newest' })
    rememberBookmarkListScroll(key, 640)

    expect(consumeBookmarkListScroll(key)).toBe(640)
    expect(consumeBookmarkListScroll(key)).toBeNull()
  })

  test('条件が変わった一覧にはスクロール位置を渡さない', () => {
    rememberBookmarkListScroll(bookmarkListSearchKey({ tagMode: 'and', sort: 'newest' }), 640)

    expect(
      consumeBookmarkListScroll(
        bookmarkListSearchKey({ q: 'react', tagMode: 'and', sort: 'newest' })
      )
    ).toBeNull()
  })
})
