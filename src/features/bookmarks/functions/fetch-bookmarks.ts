import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, inArray, isNull, like, or, sql } from 'drizzle-orm'
import * as v from 'valibot'

import { getDB } from '../../../db/get-db.server'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { tagsTable } from '../../../db/schema/tag'
import { offsetPaginationQuerySchema } from '../../../schemas/pagination'
import { requireRequestSession } from '../../auth/server/request-session.server'
import { attachTagsToBookmarks } from '../lib/attach-bookmark-tags'
import type { BookmarkListItem } from '../lib/attach-bookmark-tags'
import { normalizeListQuery } from '../lib/normalize-bookmark-list-query'

const fetchBookmarksInputSchema = v.object({
  ...offsetPaginationQuerySchema.entries,
  q: v.optional(v.string()),
  tagNames: v.optional(v.array(v.string())),
  tagMode: v.picklist(['and', 'or']),
  sort: v.picklist(['newest', 'updated'])
})

export const fetchBookmarks = createServerFn({ method: 'GET' })
  .validator(fetchBookmarksInputSchema)
  .handler(async (ctx): Promise<BookmarkListItem[]> => {
    const session = await requireRequestSession()
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
        .where(
          and(eq(tagsTable.userId, session.user.id), inArray(tagsTable.normalizedName, tagNames))
        )
        .groupBy(bookmarkTagsTable.bookmarkId)

      const matchingIds =
        tagMode === 'and'
          ? taggedBookmarks.having(
              sql`count(distinct ${tagsTable.normalizedName}) = ${tagNames.length}`
            )
          : taggedBookmarks

      conditions.push(inArray(bookmarkTable.id, matchingIds))
    }

    const bookmarks = await db
      .select()
      .from(bookmarkTable)
      .where(and(...conditions))
      .orderBy(sort === 'newest' ? desc(bookmarkTable.createdAt) : desc(bookmarkTable.updatedAt))
      .limit(limit)
      .offset(offset)

    if (bookmarks.length === 0) {
      return []
    }

    const bookmarkIds = bookmarks.map((bookmark) => bookmark.id)
    const tagRows = await db
      .select({
        bookmarkId: bookmarkTagsTable.bookmarkId,
        id: tagsTable.id,
        name: tagsTable.name
      })
      .from(bookmarkTagsTable)
      .innerJoin(tagsTable, eq(bookmarkTagsTable.tagId, tagsTable.id))
      .where(
        and(
          eq(tagsTable.userId, session.user.id),
          inArray(bookmarkTagsTable.bookmarkId, bookmarkIds)
        )
      )
      .orderBy(tagsTable.name)

    return attachTagsToBookmarks(bookmarks, tagRows)
  })
