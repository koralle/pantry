import type { BookmarkFormSubmitValues } from './bookmark-form'
import type { BookmarkEditorData, UpdateBookmarkCommand } from './index'

export function buildUpdateBookmarkCommand(
  initialData: BookmarkEditorData,
  values: BookmarkFormSubmitValues
): UpdateBookmarkCommand {
  return {
    bookmarkId: initialData.bookmarkId,
    url: values.url,
    title: values.title,
    note: values.note,
    tagIds: values.tagIds
  }
}
