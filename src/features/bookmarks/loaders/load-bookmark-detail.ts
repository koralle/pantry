import { getRpcClient } from '../../../rpc/runtime-client'
import { getBookmark } from '../functions/get-bookmark'

export async function loadBookmarkDetail(id: string) {
  try {
    const bookmark = await getBookmark({ data: { id } })
    const client = await getRpcClient()
    const tags = await client.tags.list({ limit: 1000, offset: 0 })
    const tagNames = tags.filter((tag) => bookmark.tagIds.includes(tag.id)).map((tag) => tag.name)
    return { kind: 'ok' as const, bookmark, tagNames }
  } catch (error) {
    if (error instanceof Error && error.message === 'Bookmark not found') {
      return { kind: 'not-found' as const }
    }
    throw error
  }
}
