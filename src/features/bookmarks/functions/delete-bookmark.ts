import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull } from 'drizzle-orm'
import * as v from 'valibot'

import { getDB } from '../../../db/get-db.server'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { requireRequestSession } from '../../auth/server/request-session.server'

export const deleteBookmark = createServerFn({ method: 'POST' })
  .validator(v.object({ id: v.string() }))
  .handler(async (ctx) => {
    const session = await requireRequestSession()
    const db = getDB()

    const [existing] = await db
      .select({ id: bookmarkTable.id })
      .from(bookmarkTable)
      .where(
        and(
          eq(bookmarkTable.id, ctx.data.id),
          eq(bookmarkTable.userId, session.user.id),
          isNull(bookmarkTable.deletedAt)
        )
      )
      .limit(1)

    if (existing == null) {
      throw new Error('Bookmark not found')
    }

    const now = new Date()
    await db
      .update(bookmarkTable)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(bookmarkTable.id, ctx.data.id), eq(bookmarkTable.userId, session.user.id)))

    return { id: ctx.data.id }
  })
