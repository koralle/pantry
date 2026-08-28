import { describe, expect, test } from 'vitest'

import { decodeBookmarkListCursor, encodeBookmarkListCursor } from './bookmark-list-cursor'

describe('bookmark list cursor', () => {
  test('sort 値と Bookmark ID を往復できる', () => {
    const encoded = encodeBookmarkListCursor({
      sortValueMs: 1_775_001_600_000,
      id: '019fae92-3bb0-78cd-b488-65ce0e26a001'
    })

    expect(decodeBookmarkListCursor(encoded)).toEqual({
      sortValueMs: 1_775_001_600_000,
      id: '019fae92-3bb0-78cd-b488-65ce0e26a001'
    })
  })

  test('不正なカーソルは null を返し、例外を投げない', () => {
    expect(decodeBookmarkListCursor('')).toBeNull()
    expect(decodeBookmarkListCursor('not-a-cursor')).toBeNull()
    expect(decodeBookmarkListCursor('abc:id')).toBeNull()
    expect(decodeBookmarkListCursor('123:')).toBeNull()
    expect(decodeBookmarkListCursor('1.5:id')).toBeNull()
  })
})
