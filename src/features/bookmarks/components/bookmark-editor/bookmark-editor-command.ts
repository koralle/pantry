import type { BookmarkEditorData } from '../../application/load-bookmark-for-edit'
import type { BookmarkFormSubmitValues } from './bookmark-form'

export function buildUpdateBookmarkCommand(
  initialData: BookmarkEditorData,
  values: BookmarkFormSubmitValues
) {
  return {
    bookmarkId: initialData.bookmarkId,
    url: values.url,
    title: values.title,
    note: values.note,
    tagIds: initialData.tagIds
  }
}
