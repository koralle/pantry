import type { BookmarkSearchSchema } from './bookmark-search-schema'

/**
 * Search fields that must invalidate the index route loader.
 * Without this, entrance → list keeps stale `bookmarksPromise: undefined`
 * and the list UI stays on Loading forever.
 */
export function bookmarkListLoaderDeps(search: BookmarkSearchSchema) {
  return {
    view: search.view,
    q: search.q,
    tags: search.tags,
    tagMode: search.tagMode,
    sort: search.sort,
    limit: search.limit,
    offset: search.offset
  }
}

export type BookmarkListLoaderDeps = ReturnType<typeof bookmarkListLoaderDeps>
