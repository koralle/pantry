import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'

/** 同じ一覧条件かどうかの正本。React key と scroll session がこれを共有する。 */
export function bookmarkListSearchIdentity(search: BookmarkSearchSchema): string {
  return JSON.stringify({
    q: search.q,
    tags: search.tags,
    tagMode: search.tagMode,
    sort: search.sort
  })
}

type BookmarkListScrollSession = {
  searchIdentity: string
  scrollY: number
}

let session: BookmarkListScrollSession | null = null

export function rememberBookmarkListScroll(searchIdentity: string, scrollY: number): void {
  session = { searchIdentity, scrollY }
}

export function consumeBookmarkListScroll(searchIdentity: string): number | null {
  if (session === null || session.searchIdentity !== searchIdentity) {
    return null
  }
  const { scrollY } = session
  session = null
  return scrollY
}

export function clearBookmarkListScroll(): void {
  session = null
}

/**
 * 一覧のスクロールはモジュールスコープで復元する。
 * ルーターの sessionStorage 復元は Hard Reload で一覧位置を残してしまうので使わない。
 */
export function shouldRestoreRouterScroll(location: { readonly pathname: string }): boolean {
  return location.pathname !== '/'
}
