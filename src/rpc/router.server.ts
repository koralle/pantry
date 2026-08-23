/**
 * 本番配線だけを置く。router 実装本体は `createAppRouter` 側に残し、
 * ブラウザから server-only の getDB / getAuth を import できないようにする。
 */
import { getDB } from '../db/get-db.server'
import { getAuth } from '../features/auth/functions/get-auth.server'
import { insertTag } from '../features/tags/persistence/insert-tag'
import { updateTag } from '../features/tags/persistence/update-tag'
import { createAppRouter } from './create-app-router'

export const appRouter = createAppRouter({
  getSession: async (headers) => getAuth().api.getSession({ headers }),
  insertTag: async (input) => insertTag(getDB(), input),
  updateTag: async (input) => updateTag(getDB(), input)
})
