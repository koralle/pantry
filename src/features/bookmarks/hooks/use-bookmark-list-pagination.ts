import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getErrorMessage } from 'react-error-boundary'

import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import { bookmarkListQueryOptions } from '../lib/bookmark-list-query-options'
import type { BookmarkListItem } from '../persistence/list-bookmarks'

export function useBookmarkListPagination({
  initial,
  pageLimit,
  search
}: {
  readonly initial: BookmarkListItem[]
  readonly pageLimit: number
  readonly search: BookmarkSearchSchema
}) {
  const queryClient = useQueryClient()
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
        // Offset 別の query key で次ページだけを取り、既存の append UI を維持する。
        const next = await queryClient.fetchQuery(
          bookmarkListQueryOptions({
            tagMode: search.tagMode,
            sort: search.sort,
            limit: pageLimit,
            offset: items.length,
            ...(search.q !== undefined ? { q: search.q } : {}),
            ...(search.tags !== undefined ? { tags: search.tags } : {})
          })
        )
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
