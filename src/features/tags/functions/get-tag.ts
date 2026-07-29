import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import * as v from 'valibot'

import { getDB } from '../../../db/get-db.server'
import { tagsTable } from '../../../db/schema/tag'
import { requireRequestSession } from '../../auth/functions/request-session.server'

const tagIdSchema = v.object({
  id: v.number()
})

export const getTag = createServerFn({ method: 'GET' })
  .validator(tagIdSchema)
  .handler(async (ctx) => {
    const session = await requireRequestSession()
    const db = getDB()

    const [tag] = await db
      .select()
      .from(tagsTable)
      .where(and(eq(tagsTable.id, ctx.data.id), eq(tagsTable.userId, session.user.id)))
      .limit(1)

    if (tag == null) {
      throw new Error('Tag not found')
    }

    return tag
  })
