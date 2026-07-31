/**
 * @deprecated 編集 Route は `functions/load-bookmark-for-edit` と
 * `functions/load-selectable-tags` を直接呼ぶ。互換のための薄い委譲だけを残す。
 */
import { loadBookmarkForEdit } from '../functions/load-bookmark-for-edit'
import { loadSelectableTags } from '../functions/load-selectable-tags'

export async function loadBookmarkEditor(id: string) {
  const bookmarkResult = await loadBookmarkForEdit({ data: { id } })
  if (!bookmarkResult.ok) {
    return { kind: 'not-found' as const }
  }

  return {
    kind: 'ok' as const,
    initialData: bookmarkResult.value,
    initialTags: loadSelectableTags()
  }
}
