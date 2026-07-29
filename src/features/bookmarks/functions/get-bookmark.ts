import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull } from 'drizzle-orm'
import * as v from 'valibot'

import { getDB } from '../../../db/get-db.server'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { requireRequestSession } from '../../auth/functions/request-session.server'

export const getBookmark = createServerFn({ method: 'GET' })
  .validator(v.object({ id: v.string() }))
  .handler(async (ctx) => {
    const session = await requireRequestSession()
    const db = getDB()

    const [bookmark] = await db
      .select()
      .from(bookmarkTable)
      .where(
        and(
          eq(bookmarkTable.id, ctx.data.id),
          eq(bookmarkTable.userId, session.user.id),
          isNull(bookmarkTable.deletedAt)
        )
      )
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
