import { orpc } from '../../../rpc/query'

export type BookmarkListQueryInput = {
  readonly q?: string | undefined
  readonly tags?: readonly string[] | undefined
  readonly tagMode: 'and' | 'or'
  readonly sort: 'newest' | 'updated'
  readonly limit: number
  readonly offset: number
}

/**
 * 一覧 read の query options 工場。route loader の prefetch も、component の
 * useSuspenseQuery も、load-more の offset 別 fetchQuery も、ここから作った同じ
 * options を使う。query key の所有者はこの関数に限定する。
 */
export function bookmarkListQueryOptions(input: BookmarkListQueryInput) {
  return orpc.bookmarks.list.queryOptions({
    input: {
      tagMode: input.tagMode,
      sort: input.sort,
      limit: input.limit,
      offset: input.offset,
      ...(input.q !== undefined ? { q: input.q } : {}),
      ...(input.tags !== undefined ? { tagNames: [...input.tags] } : {})
    }
  })
}
