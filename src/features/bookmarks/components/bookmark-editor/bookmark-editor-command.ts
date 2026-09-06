import type { BookmarkFormSubmitValues } from "./bookmark-form";
import type { BookmarkEditorData, UpdateBookmarkCommand } from "./index";

export const buildUpdateBookmarkCommand = (
  initialData: BookmarkEditorData,
  values: BookmarkFormSubmitValues
): UpdateBookmarkCommand => ({
  bookmarkId: initialData.bookmarkId,
  note: values.note,
  tagIds: values.tagIds,
  title: values.title,
  url: values.url,
});
