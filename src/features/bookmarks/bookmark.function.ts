import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import * as v from 'valibot'

import { getDB } from '../../db/index.server'
import { bookmarkTable, bookmarkInsertSchema } from '../../db/schema/bookmark'
import { offsetPaginationQuerySchema } from '../../schemas/pagination'
import { ensureSession } from '../auth/auth.function'

const addBookmarkInputSchema = v.pick(bookmarkInsertSchema, ['url', 'title', 'note'])

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

export const addBookmark = createServerFn({ method: 'POST' })
  .validator(addBookmarkInputSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const id = uuidv7()
    const { url, title, note } = ctx.data

    await db.insert(bookmarkTable).values({ id, url, title, note, userId: session.user.id })

    return { id }
  })
