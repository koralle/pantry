import { createServerFn } from '@tanstack/react-start'
import * as v from 'valibot'

import { getDB } from '../../../db/get-db.server'
import { userIdSchema } from '../../auth/domain/auth-values'
import { requireRequestSession } from '../../auth/functions/request-session.server'
import { createTag as createTagUseCase } from '../application/create-tag'

const createTagInputSchema = v.object({
  name: v.string()
})

/**
 * 編集画面の createTag port 用 Server Function。
 * 既知の業務エラーは Result、unexpected-error は HTTP 500 相当として throw する。
 */
export const createTag = createServerFn({ method: 'POST' })
  .validator(createTagInputSchema)
  .handler(async (ctx) => {
    const session = await requireRequestSession()
    const actorId = v.parse(userIdSchema, session.user.id)
    const db = getDB()

    const result = await createTagUseCase({
      db,
      actorId,
      name: ctx.data.name
    })

    if (!result.ok && result.error.code === 'unexpected-error') {
      throw new Error('Failed to create tag')
    }

    return result
  })
