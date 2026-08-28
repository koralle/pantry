import { describe, expect, test, vi } from 'vitest'

import { orpc } from '../../../rpc/query'
import {
  consumeBookmarkListScroll,
  rememberBookmarkListScroll
} from './bookmark-list-scroll-session'
import { resetBookmarkListCache } from './reset-bookmark-list-cache'

describe('resetBookmarkListCache', () => {
  test('infinite list query を remove し、保存したスクロール位置を捨てる', () => {
    const removeQueries = vi.fn()
    rememberBookmarkListScroll({ q: 'q', tagMode: 'and', sort: 'newest' }, 480)
    const queryClient = { removeQueries } as never

    resetBookmarkListCache(queryClient)

    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: orpc.bookmarks.list.key({ type: 'infinite' })
    })
    expect(consumeBookmarkListScroll({ q: 'q', tagMode: 'and', sort: 'newest' })).toBeNull()
  })
})
