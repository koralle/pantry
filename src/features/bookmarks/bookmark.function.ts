import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import * as v from 'valibot'

import { getDB } from '../../db/index.server'
import { bookmarkTable, bookmarkInsertSchema } from '../../db/schema/bookmark'
import { offsetPaginationQuerySchema } from '../../schemas/pagination'
import { ensureSession } from '../auth/auth.function'

const addBookmarkInputSchema = v.pick(bookmarkInsertSchema, ['url', 'title', 'note'])

export const updateBookmarkInputSchema = v.object({
  id: v.string(),
  url: v.pipe(v.string(), v.url()),
  title: v.string(),
  note: v.nullable(v.string())
})

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

    try {
      await db
        .update(bookmarkTable)
        .set({ url, title, note, updatedAt: new Date() })
        .where(eq(bookmarkTable.id, id))
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('URL already exists', { cause: error })
      }
      throw error
    }

    return { id }
  })
