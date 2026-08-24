/**
 * 本番配線だけを置く。router 実装本体は `createAppRouter` 側に残し、
 * ブラウザから server-only の getDB / getAuth を import できないようにする。
 */
import { getDB } from '../db/get-db.server'
import type { SessionUser } from '../features/auth/domain/auth-values'
import { getAuth } from '../features/auth/server/get-auth.server'
import { insertBookmark } from '../features/bookmarks/persistence/insert-bookmark'
import { selectBookmarkEditor } from '../features/bookmarks/persistence/select-bookmark-editor'
import { updateBookmark } from '../features/bookmarks/persistence/update-bookmark'
import { fetchPageTitle } from '../features/bookmarks/server/fetch-page-title.server'
import { insertTag } from '../features/tags/persistence/insert-tag'
import { selectShelfTags } from '../features/tags/persistence/select-shelf-tags'
import { selectTagById } from '../features/tags/persistence/select-tag-by-id'
import { selectTags } from '../features/tags/persistence/select-tags'
import { touchTag } from '../features/tags/persistence/touch-tag'
import { updateTag } from '../features/tags/persistence/update-tag'
import { createAppRouter } from './create-app-router'

export const appRouter = createAppRouter({
  getSession: async (headers): Promise<SessionUser | null> => {
    const session = await getAuth().api.getSession({ headers })
    if (!session) {
      return null
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email
    }
  },
  insertTag: async (input) => insertTag(getDB(), input),
  updateTag: async (input) => updateTag(getDB(), input),
  touchTag: async (input) => touchTag(getDB(), input),
  listShelfTags: async (userId) => selectShelfTags(getDB(), userId),
  listTags: async (userId, page) => selectTags(getDB(), userId, page),
  findTagById: async (userId, id) => selectTagById(getDB(), userId, id),
  insertBookmark: async (input) => insertBookmark(getDB(), input),
  fetchPageTitle: async (url) => fetchPageTitle(url),
  updateBookmark: async (input) => updateBookmark(getDB(), input),
  findBookmarkEditor: async (userId, id) => selectBookmarkEditor(getDB(), userId, id)
})
