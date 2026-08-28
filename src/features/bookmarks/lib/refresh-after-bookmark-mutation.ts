import type { QueryClient } from '@tanstack/react-query'

import { resetBookmarkListCache } from './reset-bookmark-list-cache'

/**
 * Mutation の成功と loader の再取得は別の成功条件。
 * invalidate を mutation の Promise に繋ぐと、書いたあとにフォームが失敗表示へ戻る。
 */
export function refreshAfterBookmarkMutation(
  router: { invalidate: () => Promise<unknown> },
  queryClient: QueryClient,
  operation: string
): void {
  resetBookmarkListCache(queryClient)
  void router.invalidate().catch((error: unknown) => {
    console.error(`Failed to refresh route data after ${operation}`, error)
  })
}
