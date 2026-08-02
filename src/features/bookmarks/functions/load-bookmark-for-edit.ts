import { createServerFn } from '@tanstack/react-start'
import * as v from 'valibot'

import { getDB } from '../../../db/get-db.server'
import { err } from '../../../shared/domain/result'
import { userIdSchema } from '../../auth/domain/auth-values'
import { requireRequestSession } from '../../auth/functions/request-session.server'
import { loadBookmarkForEdit as loadBookmarkForEditUseCase } from '../application/load-bookmark-for-edit'
import type { LoadBookmarkForEditError } from '../application/load-bookmark-for-edit'
import { bookmarkIdSchema } from '../domain/bookmark-values'

const loadBookmarkForEditInputSchema = v.object({
  id: v.string()
})

/**
 * 編集画面用の Bookmark 読み取り Server Function。
 * bookmark-not-found は Result で返し、unexpected-error は HTTP 500 相当として throw する。
 */
export const loadBookmarkForEdit = createServerFn({ method: 'GET' })
  .validator(loadBookmarkForEditInputSchema)
  .handler(async (ctx) => {
    const session = await requireRequestSession()
    const actorId = v.parse(userIdSchema, session.user.id)
    const db = getDB()

    const parsedId = v.safeParse(bookmarkIdSchema, ctx.data.id)
    if (!parsedId.success) {
      return err({ code: 'bookmark-not-found' } satisfies LoadBookmarkForEditError)
    }

    const result = await loadBookmarkForEditUseCase({
      db,
      actorId,
      bookmarkId: parsedId.output
    })

    if (!result.ok && result.error.code === 'unexpected-error') {
      throw new Error('Failed to load bookmark for edit')
    }

    return result
  })
