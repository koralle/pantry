import { orpc } from '../../../rpc/query'

/**
 * 詳細 read の query options 工場。route loader の prefetch と
 * detail screen の useSuspenseQuery が同じ key を読む。
 */
export function bookmarkDetailQueryOptions(id: string) {
  return orpc.bookmarks.detail.queryOptions({
    input: { id }
  })
}
