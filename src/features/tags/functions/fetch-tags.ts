import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { getDB } from '../../../db/get-db.server'
import { tagsTable } from '../../../db/schema/tag'
import { offsetPaginationQuerySchema } from '../../../schemas/pagination'
import { requireRequestSession } from '../../auth/functions/request-session.server'

export const fetchTags = createServerFn({ method: 'GET' })
  .validator(offsetPaginationQuerySchema)
  .handler(async (ctx) => {
    const session = await requireRequestSession()

    const { limit, offset } = ctx.data

    const db = getDB()

    return db
      .select()
      .from(tagsTable)
      .where(eq(tagsTable.userId, session.user.id))
      .limit(limit)
      .offset(offset)
  })
