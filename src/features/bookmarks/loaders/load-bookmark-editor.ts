import { fetchTags } from '../../tags/functions/fetch-tags'
import { getBookmark } from '../functions/get-bookmark'

export async function loadBookmarkEditor(id: string) {
  try {
    const bookmark = await getBookmark({ data: { id } })
    const tags = await fetchTags({ data: { limit: 1000, offset: 0 } })
    return { kind: 'ok' as const, bookmark, tags }
  } catch (error) {
    if (error instanceof Error && error.message === 'Bookmark not found') {
      return { kind: 'not-found' as const }
    }
    throw error
  }
}
