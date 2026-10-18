import { getDB } from "../../db/get-db.server";
import { getBookmarkCount } from "../../features/bookmarks/persistence/get-bookmark-count";
import { getBookmarkDetail } from "../../features/bookmarks/persistence/get-bookmark-detail";
import { insertBookmark } from "../../features/bookmarks/persistence/insert-bookmark";
import { listBookmarks } from "../../features/bookmarks/persistence/list-bookmarks";
import { selectBookmarkEditor } from "../../features/bookmarks/persistence/select-bookmark-editor";
import { setBookmarkFavorite } from "../../features/bookmarks/persistence/set-bookmark-favorite";
import { softDeleteBookmark } from "../../features/bookmarks/persistence/soft-delete-bookmark";
import { updateBookmark } from "../../features/bookmarks/persistence/update-bookmark";
import type { BookmarksDeps } from "../contract/bookmark-procedures";

export const bookmarksDeps: BookmarksDeps = {
  findBookmarkEditor: async (userId, id) =>
    await selectBookmarkEditor(getDB(), userId, id),
  getBookmarkCount: async (userId, view) =>
    await getBookmarkCount(getDB(), userId, view),
  getBookmarkDetail: async (userId, input) =>
    await getBookmarkDetail(getDB(), userId, input),
  insertBookmark: async (input) => await insertBookmark(getDB(), input),
  listBookmarks: async (input) => await listBookmarks(getDB(), input),
  setBookmarkFavorite: async (input) =>
    await setBookmarkFavorite(getDB(), input),
  softDeleteBookmark: async (input) => await softDeleteBookmark(getDB(), input),
  updateBookmark: async (input) => await updateBookmark(getDB(), input),
};
