import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import * as v from 'valibot'

import { getDB } from '../../db/index.server'
import { bookmarkTable, bookmarkInsertSchema } from '../../db/schema/bookmark'
import { offsetPaginationQuerySchema } from '../../schemas/pagination'
import { ensureSession } from '../auth/auth.function'
import { updateBookmarkInputSchema } from './bookmark.schema'

export { updateBookmarkInputSchema } from './bookmark.schema'

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

export const getBookmark = createServerFn({ method: 'GET' })
  .validator(v.object({ id: v.string() }))
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const [bookmark] = await db
      .select()
      .from(bookmarkTable)
      .where(and(eq(bookmarkTable.id, ctx.data.id), eq(bookmarkTable.userId, session.user.id)))
      .limit(1)

    if (bookmark == null) {
      throw new Error('Bookmark not found')
    }

    return bookmark
  })

export const updateBookmark = createServerFn({ method: 'POST' })
  .validator(updateBookmarkInputSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const { id, url, title, note } = ctx.data

    const [existing] = await db
      .select()
      .from(bookmarkTable)
      .where(and(eq(bookmarkTable.id, id), eq(bookmarkTable.userId, session.user.id)))
      .limit(1)

    if (existing == null) {
      throw new Error('Bookmark not found')
    }

    const [duplicate] = await db
      .select()
      .from(bookmarkTable)
      .where(and(eq(bookmarkTable.userId, session.user.id), eq(bookmarkTable.url, url)))
      .limit(1)

    if (duplicate != null && duplicate.id !== id) {
      throw new Error('URL already exists')
    }

    await db
      .update(bookmarkTable)
      .set({ url, title, note, updatedAt: new Date() })
      .where(and(eq(bookmarkTable.id, id), eq(bookmarkTable.userId, session.user.id)))

    return { id }
  })
