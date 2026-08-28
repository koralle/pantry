import { orpc } from '../../../rpc/query'
import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'

/** 一覧→詳細→一覧で読み込み済みページを捨てない。Mutation 時は明示的に remove する。 */
const BOOKMARK_LIST_STALE_TIME = Number.POSITIVE_INFINITY
const BOOKMARK_LIST_GC_TIME = 30 * 60 * 1000

export type BookmarkListQueryInput = {
  readonly q?: string | undefined
  readonly tags?: readonly string[] | undefined
  readonly tagMode: BookmarkSearchSchema['tagMode']
  readonly sort: BookmarkSearchSchema['sort']
}

/**
 * 一覧 read の query options 工場。route loader の prefetchInfiniteQuery も、
 * component の useSuspenseInfiniteQuery も、ここから作った同じ options を使う。
 * query key の所有者はこの関数に限定する。
 */
export function bookmarkListQueryOptions(input: BookmarkListQueryInput) {
  return orpc.bookmarks.list.infiniteOptions({
    input: (pageParam: string | undefined) => ({
      tagMode: input.tagMode,
      sort: input.sort,
      ...(input.q !== undefined ? { q: input.q } : {}),
      ...(input.tags !== undefined ? { tagNames: [...input.tags] } : {}),
      ...(pageParam !== undefined ? { cursor: pageParam } : {})
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: BOOKMARK_LIST_STALE_TIME,
    gcTime: BOOKMARK_LIST_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false
  })
}
