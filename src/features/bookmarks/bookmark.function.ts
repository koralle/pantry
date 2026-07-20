import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, inArray, isNull, like, or, sql } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import * as v from 'valibot'

import { getDB } from '../../db/index.server'
import { bookmarkTable } from '../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../db/schema/bookmark-tag'
import { tagsTable } from '../../db/schema/tag'
import { offsetPaginationQuerySchema } from '../../schemas/pagination'
import { ensureSession } from '../auth/auth.function'
import { normalizeListQuery } from './bookmark-list-query'
import { addBookmarkInputSchema, updateBookmarkInputSchema } from './bookmark.schema'

export { updateBookmarkInputSchema } from './bookmark.schema'
export type { FetchBookmarksInput } from './bookmark-list-query'

const fetchBookmarksInputSchema = v.object({
  ...offsetPaginationQuerySchema.entries,
  q: v.optional(v.string()),
  tagNames: v.optional(v.array(v.string())),
  tagMode: v.picklist(['and', 'or']),
  sort: v.picklist(['newest', 'updated'])
})

export const fetchBookmarks = createServerFn({ method: 'GET' })
  .validator(fetchBookmarksInputSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const { q, tagNames, tagMode, sort, limit, offset } = normalizeListQuery({
      tagMode: ctx.data.tagMode,
      sort: ctx.data.sort,
      limit: ctx.data.limit,
      offset: ctx.data.offset,
      ...(ctx.data.q !== undefined ? { q: ctx.data.q } : {}),
      ...(ctx.data.tagNames !== undefined ? { tagNames: ctx.data.tagNames } : {})
    })
    const db = getDB()

    const conditions = [eq(bookmarkTable.userId, session.user.id), isNull(bookmarkTable.deletedAt)]

    if (q != null) {
      const pattern = `%${q}%`
      conditions.push(
        or(
          like(bookmarkTable.title, pattern),
          like(bookmarkTable.url, pattern),
          like(bookmarkTable.note, pattern)
        )!
      )
    }

    if (tagNames != null) {
      const taggedBookmarks = db
        .select({ bookmarkId: bookmarkTagsTable.bookmarkId })
        .from(bookmarkTagsTable)
        .innerJoin(tagsTable, eq(bookmarkTagsTable.tagId, tagsTable.id))
        .where(and(eq(tagsTable.userId, session.user.id), inArray(tagsTable.name, tagNames)))
        .groupBy(bookmarkTagsTable.bookmarkId)

      const matchingIds =
        tagMode === 'and'
          ? taggedBookmarks.having(sql`count(distinct ${tagsTable.name}) = ${tagNames.length}`)
          : taggedBookmarks

      conditions.push(inArray(bookmarkTable.id, matchingIds))
    }

    return db
      .select()
      .from(bookmarkTable)
      .where(and(...conditions))
      .orderBy(sort === 'newest' ? desc(bookmarkTable.createdAt) : desc(bookmarkTable.updatedAt))
      .limit(limit)
      .offset(offset)
  })

export const addBookmark = createServerFn({ method: 'POST' })
  .validator(addBookmarkInputSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const id = uuidv7()
    const { url, title, note, tags } = ctx.data

    await db.insert(bookmarkTable).values({ id, url, title, note, userId: session.user.id })

    if (tags.length > 0) {
      await db.insert(bookmarkTagsTable).values(tags.map((tagId) => ({ bookmarkId: id, tagId })))
      await db
        .update(tagsTable)
        .set({ lastUsedAt: new Date() })
        .where(and(eq(tagsTable.userId, session.user.id), inArray(tagsTable.id, tags)))
    }

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

    const tagRows = await db
      .select({ tagId: bookmarkTagsTable.tagId })
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmarkId, bookmark.id))

    return { ...bookmark, tagIds: tagRows.map((row) => row.tagId) }
  })

export const updateBookmark = createServerFn({ method: 'POST' })
  .validator(updateBookmarkInputSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const { id, url, title, note, tags } = ctx.data

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

    await db.delete(bookmarkTagsTable).where(eq(bookmarkTagsTable.bookmarkId, id))

    if (tags.length > 0) {
      await db.insert(bookmarkTagsTable).values(tags.map((tagId) => ({ bookmarkId: id, tagId })))
      await db
        .update(tagsTable)
        .set({ lastUsedAt: new Date() })
        .where(and(eq(tagsTable.userId, session.user.id), inArray(tagsTable.id, tags)))
    }

    return { id }
  })
