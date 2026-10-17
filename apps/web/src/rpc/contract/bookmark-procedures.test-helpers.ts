import type { BookmarksDeps } from "./bookmark-procedures";

/** ブックマークの service の既定 stub。テストは確かめたい service だけを上書きする。 */
export const stubBookmarksDeps = (): BookmarksDeps => ({
  findBookmarkEditor: async () => null,
  getBookmarkCount: async () => 0,
  getBookmarkDetail: async () => null,
  insertBookmark: async () => ({ kind: "duplicate-url" }),
  listBookmarks: async () => ({ items: [], nextCursor: null }),
  setBookmarkFavorite: async () => ({ kind: "bookmark-not-found" }),
  softDeleteBookmark: async () => ({ id: "", kind: "bookmark-not-found" }),
  updateBookmark: async () => ({ kind: "bookmark-not-found" }),
});
