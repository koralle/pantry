import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray } from 'drizzle-orm'
import * as v from 'valibot'

import { getDB } from '../../../db/get-db.server'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { tagsTable } from '../../../db/schema/tag'
import { requireRequestSession } from '../../auth/functions/request-session.server'

export const updateBookmarkInputSchema = v.object({
  id: v.string(),
  url: v.pipe(v.string(), v.url()),
  title: v.string(),
  note: v.nullable(v.string()),
  tags: v.array(v.number())
})

export const updateBookmark = createServerFn({ method: 'POST' })
  .validator(updateBookmarkInputSchema)
  .handler(async (ctx) => {
    const session = await requireRequestSession()
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
