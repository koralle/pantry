import { fetchTags } from '../../tags/functions/fetch-tags'
import { getBookmark } from '../functions/get-bookmark'

export async function loadBookmarkDetail(id: string) {
  try {
    const bookmark = await getBookmark({ data: { id } })
    const tags = await fetchTags({ data: { limit: 1000, offset: 0 } })
    const tagNames = tags.filter((tag) => bookmark.tagIds.includes(tag.id)).map((tag) => tag.name)
    return { kind: 'ok' as const, bookmark, tagNames }
  } catch (error) {
    if (error instanceof Error && error.message === 'Bookmark not found') {
      return { kind: 'not-found' as const }
    }
    throw error
  }
}
