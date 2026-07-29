import type { BookmarkSelectType } from '../../../db/schema/bookmark'

export type BookmarkListTag = {
  id: number
  name: string
}

export type BookmarkListItem = BookmarkSelectType & {
  tags: BookmarkListTag[]
}

export type BookmarkTagRow = {
  bookmarkId: string
  id: number
  name: string
}

export function attachTagsToBookmarks<T extends { id: string }>(
  bookmarks: readonly T[],
  tagRows: readonly BookmarkTagRow[]
): Array<T & { tags: BookmarkListTag[] }> {
  const tagsByBookmarkId = new Map<string, BookmarkListTag[]>()

  for (const row of tagRows) {
    const tags = tagsByBookmarkId.get(row.bookmarkId)
    const tag = { id: row.id, name: row.name }
    if (tags == null) {
      tagsByBookmarkId.set(row.bookmarkId, [tag])
    } else {
      tags.push(tag)
    }
  }

  return bookmarks.map((bookmark) => ({
    ...bookmark,
    tags: tagsByBookmarkId.get(bookmark.id) ?? []
  }))
}
