import type { BookmarkSearchSchema } from '../../-lib/bookmark-search-schema'
import { defaultBookmarkSearch } from '../../-lib/bookmark-search-schema'

export function buildListBackSearch(tags?: readonly string[]): BookmarkSearchSchema {
  const search: BookmarkSearchSchema = {
    ...defaultBookmarkSearch,
    view: 'list'
  }

  if (tags !== undefined && tags.length > 0) {
    search.tags = [...tags]
  }

  return search
}
