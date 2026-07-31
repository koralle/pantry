import { createServerFn } from '@tanstack/react-start'
import * as v from 'valibot'

import { getDB } from '../../../db/get-db.server'
import { userIdSchema } from '../../auth/domain/auth-values'
import { requireRequestSession } from '../../auth/functions/request-session.server'
import { loadSelectableTags as loadSelectableTagsUseCase } from '../application/load-selectable-tags'

/**
 * 編集画面のタグ候補読み取り。
 * 失敗しても本体フォームを落とさないため、unexpected も含め Result で返す。
 */
export const loadSelectableTags = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await requireRequestSession()
  const actorId = v.parse(userIdSchema, session.user.id)
  const db = getDB()

  return loadSelectableTagsUseCase({ db, actorId })
})
