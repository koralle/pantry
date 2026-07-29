import { useEffect, useState } from 'react'
import { getErrorMessage } from 'react-error-boundary'

import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import { fetchBookmarks } from '../functions/fetch-bookmarks'
import type { BookmarkListItem } from '../lib/attach-bookmark-tags'

export function useBookmarkListPagination({
  initial,
  pageLimit,
  search
}: {
  readonly initial: BookmarkListItem[]
  readonly pageLimit: number
  readonly search: BookmarkSearchSchema
}) {
  const [items, setItems] = useState(initial)
  const [hasMore, setHasMore] = useState(initial.length >= pageLimit)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    setItems(initial)
    setHasMore(initial.length >= pageLimit)
    setLoadMoreError(null)
  }, [initial, pageLimit])

  const loadMore = () => {
    if (isLoadingMore) {
      return
    }
    setLoadMoreError(null)
    setIsLoadingMore(true)
    void (async () => {
      try {
        const next = await fetchBookmarks({
          data: {
            tagMode: search.tagMode,
            sort: search.sort,
            limit: pageLimit,
            offset: items.length,
            ...(search.q !== undefined ? { q: search.q } : {}),
            ...(search.tags !== undefined ? { tagNames: search.tags } : {})
          }
        })
        setItems((prev) => [...prev, ...next])
        setHasMore(next.length >= pageLimit)
      } catch (error) {
        setLoadMoreError(getErrorMessage(error) ?? '続きの読み込みに失敗しました')
      } finally {
        setIsLoadingMore(false)
      }
    })()
  }

  return { items, hasMore, loadMoreError, isLoadingMore, loadMore }
}
