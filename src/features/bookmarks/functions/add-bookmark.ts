import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import * as v from 'valibot'

import { getDB } from '../../../db/get-db.server'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { tagsTable } from '../../../db/schema/tag'
import { requireRequestSession } from '../../auth/functions/request-session.server'

export const addBookmarkInputSchema = v.object({
  url: v.pipe(v.string(), v.url()),
  title: v.string(),
  note: v.nullable(v.string()),
  tags: v.array(v.number())
})

export const addBookmark = createServerFn({ method: 'POST' })
  .validator(addBookmarkInputSchema)
  .handler(async (ctx) => {
    const session = await requireRequestSession()
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
