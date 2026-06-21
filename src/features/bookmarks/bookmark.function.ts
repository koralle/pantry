import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { getDB } from '../../db/index.server'
import { bookmarkTable } from '../../db/schema/bookmark'
import { offsetPaginationQuerySchema } from '../../schemas/pagination'
import { ensureSession } from '../auth/auth.function'

export const fetchBookmarks = createServerFn({ method: 'GET' })
  .validator(offsetPaginationQuerySchema)
  .handler(async (ctx) => {
    const session = await ensureSession()

    const { limit, offset } = ctx.data

    const db = getDB()

    return db
      .select()
      .from(bookmarkTable)
      .where(eq(bookmarkTable.userId, session.user.id))
      .limit(limit)
      .offset(offset)
  })
