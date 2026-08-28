import type { BookmarkSearchSchema } from '../../../features/navigation/lib/bookmark-search'

/**
 * Search fields that must invalidate the index route loader.
 */
export function bookmarkListLoaderDeps(search: BookmarkSearchSchema) {
  return {
    q: search.q,
    tags: search.tags,
    tagMode: search.tagMode,
    sort: search.sort
  }
}

export type BookmarkListLoaderDeps = ReturnType<typeof bookmarkListLoaderDeps>
