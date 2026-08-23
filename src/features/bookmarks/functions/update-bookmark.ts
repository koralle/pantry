import { createServerFn } from '@tanstack/react-start'
import * as v from 'valibot'

import { getDB } from '../../../db/get-db.server'
import { err, ok } from '../../../shared/domain/result'
import { userIdSchema } from '../../auth/domain/auth-values'
import { requireRequestSession } from '../../auth/server/request-session.server'
import { tagIdSchema } from '../../tags/domain/tag-values'
import { executeUpdateBookmark } from '../application/execute-update-bookmark'
import type { UpdateBookmarkResult } from '../application/execute-update-bookmark'
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from '../domain/bookmark-values'

export const updateBookmarkInputSchema = v.object({
  id: v.string(),
  url: v.string(),
  title: v.string(),
  note: v.nullable(v.string()),
  tags: v.array(v.number())
})

/**
 * ブックマーク更新 Server Function。
 * 既知の業務エラーは Result で返し、unexpected-error は HTTP 500 相当として throw する。
 * クライアントへ内部 Error や cause は返さない。
 */
export const updateBookmark = createServerFn({ method: 'POST' })
  .validator(updateBookmarkInputSchema)
  .handler(async (ctx): Promise<UpdateBookmarkResult> => {
    const session = await requireRequestSession()
    const actorId = v.parse(userIdSchema, session.user.id)
    const db = getDB()

    const parsedId = v.safeParse(bookmarkIdSchema, ctx.data.id)
    if (!parsedId.success) {
      return err({ code: 'bookmark-not-found' })
    }

    const parsedUrl = v.safeParse(bookmarkUrlSchema, ctx.data.url)
    if (!parsedUrl.success) {
      return err({ code: 'invalid-url', field: 'url' })
    }

    const parsedTitle = v.safeParse(bookmarkTitleSchema, ctx.data.title)
    if (!parsedTitle.success) {
      return err({ code: 'invalid-title', field: 'title' })
    }

    const parsedNote = v.safeParse(bookmarkNoteSchema, ctx.data.note)
    if (!parsedNote.success) {
      throw new Error('Failed to update bookmark')
    }

    const parsedTags = v.safeParse(v.array(tagIdSchema), ctx.data.tags)
    if (!parsedTags.success) {
      throw new Error('Failed to update bookmark')
    }

    const result = await executeUpdateBookmark({
      db,
      actorId,
      command: {
        bookmarkId: parsedId.output,
        url: parsedUrl.output,
        title: parsedTitle.output,
        note: parsedNote.output,
        tagIds: parsedTags.output
      }
    })

    if (!result.ok && result.error.code === 'unexpected-error') {
      throw new Error('Failed to update bookmark')
    }

    if (result.ok) {
      return ok(result.value)
    }

    return result
  })
