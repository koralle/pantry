import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'

export function bookmarkListSearchEquals(
  left: BookmarkSearchSchema,
  right: BookmarkSearchSchema
): boolean {
  return (
    left.q === right.q &&
    left.tagMode === right.tagMode &&
    left.sort === right.sort &&
    tagsEqual(left.tags, right.tags)
  )
}

function tagsEqual(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined
): boolean {
  if (left === right) {
    return true
  }
  if (left == null || right == null) {
    return false
  }
  if (left.length !== right.length) {
    return false
  }
  return left.every((tag, index) => tag === right[index])
}

type BookmarkListScrollSession = {
  search: BookmarkSearchSchema
  scrollY: number
}

let session: BookmarkListScrollSession | null = null

export function rememberBookmarkListScroll(search: BookmarkSearchSchema, scrollY: number): void {
  session = { search, scrollY }
}

export function consumeBookmarkListScroll(search: BookmarkSearchSchema): number | null {
  if (session == null || !bookmarkListSearchEquals(session.search, search)) {
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
