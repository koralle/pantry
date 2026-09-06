/**
 * 本番配線だけを置く。router 実装本体は `createAppRouter` 側に残し、
 * ブラウザから server-only の getDB / getAuth を import できないようにする。
 */
import { getDB } from "../db/get-db.server";
import type { SessionUser } from "../features/auth/domain/auth-values";
import { getAuth } from "../features/auth/server/get-auth.server";
import { getBookmarkDetail } from "../features/bookmarks/persistence/get-bookmark-detail";
import { insertBookmark } from "../features/bookmarks/persistence/insert-bookmark";
import { listBookmarks } from "../features/bookmarks/persistence/list-bookmarks";
import { selectBookmarkEditor } from "../features/bookmarks/persistence/select-bookmark-editor";
import { softDeleteBookmark } from "../features/bookmarks/persistence/soft-delete-bookmark";
import { updateBookmark } from "../features/bookmarks/persistence/update-bookmark";
import { fetchPageTitle } from "../features/bookmarks/server/fetch-page-title.server";
import { insertTag } from "../features/tags/persistence/insert-tag";
import { selectShelfTags } from "../features/tags/persistence/select-shelf-tags";
import { selectTagById } from "../features/tags/persistence/select-tag-by-id";
import { selectTags } from "../features/tags/persistence/select-tags";
import { touchTag } from "../features/tags/persistence/touch-tag";
import { updateTag } from "../features/tags/persistence/update-tag";
import { createAppRouter } from "./create-app-router";

export const appRouter = createAppRouter({
  fetchPageTitle: async (url) => await fetchPageTitle(url),
  findBookmarkEditor: async (userId, id) =>
    await selectBookmarkEditor(getDB(), userId, id),
  findTagById: async (userId, id) => await selectTagById(getDB(), userId, id),
  getBookmarkDetail: async (userId, input) =>
    await getBookmarkDetail(getDB(), userId, input),
  getSession: async (headers): Promise<SessionUser | null> => {
    const session = await getAuth().api.getSession({ headers });
    if (!session) {
      return null;
    }

    return {
      email: session.user.email,
      id: session.user.id,
      name: session.user.name,
    };
  },
  insertBookmark: async (input) => await insertBookmark(getDB(), input),
  insertTag: async (input) => await insertTag(getDB(), input),
  listBookmarks: async (input) => await listBookmarks(getDB(), input),
  listShelfTags: async (userId) => await selectShelfTags(getDB(), userId),
  listTags: async (userId, page) => await selectTags(getDB(), userId, page),
  softDeleteBookmark: async (input) => await softDeleteBookmark(getDB(), input),
  touchTag: async (input) => await touchTag(getDB(), input),
  updateBookmark: async (input) => await updateBookmark(getDB(), input),
  updateTag: async (input) => await updateTag(getDB(), input),
});
