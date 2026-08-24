import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import * as v from 'valibot'

import { getDB } from '../../../db/get-db.server'
import { tagsTable } from '../../../db/schema/tag'
import { requireRequestSession } from '../../auth/server/request-session.server'

const tagIdSchema = v.object({
  id: v.number()
})

export const touchTagLastUsed = createServerFn({ method: 'POST' })
  .validator(tagIdSchema)
  .handler(async (ctx) => {
    const session = await requireRequestSession()
    const db = getDB()

    const [updated] = await db
      .update(tagsTable)
      .set({
        lastUsedAt: new Date()
      })
      .where(and(eq(tagsTable.id, ctx.data.id), eq(tagsTable.userId, session.user.id)))
      .returning({ id: tagsTable.id })

    if (updated == null) {
      throw new Error('Tag not found')
    }

    return { ok: true as const }
  })
