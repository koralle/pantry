import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";

/** 同じ一覧条件かどうかの正本。React key と scroll session がこれを共有する。 */
export const bookmarkListSearchIdentity = (
  search: BookmarkSearchSchema
): string =>
  JSON.stringify({
    q: search.q,
    sort: search.sort,
    tagMode: search.tagMode,
    tags: search.tags,
  });

interface BookmarkListScrollSession {
  searchIdentity: string;
  scrollTop: number;
}

let session: BookmarkListScrollSession | null = null;

export const rememberBookmarkListScroll = (
  searchIdentity: string,
  scrollTop: number
): void => {
  session = { scrollTop, searchIdentity };
};

export const consumeBookmarkListScroll = (
  searchIdentity: string
): number | null => {
  if (session === null || session.searchIdentity !== searchIdentity) {
    return null;
  }
  const { scrollTop } = session;
  session = null;
  return scrollTop;
};

export const clearBookmarkListScroll = (): void => {
  session = null;
};

/**
 * 一覧のスクロールはモジュールスコープで復元する。
 * ルーターの sessionStorage 復元は Hard Reload で一覧位置を残してしまうので使わない。
 */
export const shouldRestoreRouterScroll = (location: {
  readonly pathname: string;
}): boolean => location.pathname !== "/bookmarks";
