import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { useLayoutEffect } from 'react'
import { getErrorMessage } from 'react-error-boundary'

import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import { bookmarkListQueryOptions } from '../lib/bookmark-list-query-options'
import {
  bookmarkListSearchIdentity,
  consumeBookmarkListScroll,
  rememberBookmarkListScroll
} from '../lib/bookmark-list-scroll-session'

export function useBookmarkListPagination({ search }: { readonly search: BookmarkSearchSchema }) {
  const query = useSuspenseInfiniteQuery(bookmarkListQueryOptions(search))
  const items = query.data.pages.flatMap((page) => page.items)
  const searchIdentity = bookmarkListSearchIdentity(search)

  useLayoutEffect(() => {
    const scrollY = consumeBookmarkListScroll(searchIdentity)
    if (scrollY != null) {
      window.scrollTo(0, scrollY)
    }

    return () => {
      rememberBookmarkListScroll(searchIdentity, window.scrollY)
    }
  }, [searchIdentity])

  const loadMore = () => {
    if (query.isFetchingNextPage || !query.hasNextPage) {
      return
    }
    void query.fetchNextPage()
  }

  return {
    items,
    hasMore: query.hasNextPage,
    loadMoreError: query.isFetchNextPageError
      ? (getErrorMessage(query.error) ?? '続きの読み込みに失敗しました')
      : null,
    isLoadingMore: query.isFetchingNextPage,
    loadMore
  }
}
