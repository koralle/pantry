import type { QueryClient } from '@tanstack/react-query'

import { orpc } from '../../../rpc/query'
import { clearBookmarkListScroll } from './bookmark-list-scroll-session'

/**
 * Mutation 後は古いカーソル列を捨て、次の一覧構築を先頭ページから始める。
 * Infinite Query の全ページ順次再取得はしない。
 */
export function resetBookmarkListCache(queryClient: QueryClient): void {
  clearBookmarkListScroll()
  queryClient.removeQueries({ queryKey: orpc.bookmarks.list.key({ type: 'infinite' }) })
}
