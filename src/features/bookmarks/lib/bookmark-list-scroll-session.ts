export function bookmarkListSearchKey(search: {
  readonly q?: string | undefined
  readonly tags?: readonly string[] | undefined
  readonly tagMode: string
  readonly sort: string
}): string {
  return [search.q ?? '', search.tags?.join(',') ?? '', search.tagMode, search.sort].join('|')
}

type BookmarkListScrollSession = {
  searchKey: string
  scrollY: number
}

let session: BookmarkListScrollSession | null = null

export function rememberBookmarkListScroll(searchKey: string, scrollY: number): void {
  session = { searchKey, scrollY }
}

export function consumeBookmarkListScroll(searchKey: string): number | null {
  if (session == null || session.searchKey !== searchKey) {
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
