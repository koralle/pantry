import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull, sql } from 'drizzle-orm'

import { getDB } from '../../../db/get-db.server'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { tagsTable } from '../../../db/schema/tag'
import { requireRequestSession } from '../../auth/functions/request-session.server'
import type { ShelfTag } from '../lib/tag-shelf'

export const fetchShelfTags = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ShelfTag[]> => {
    const session = await requireRequestSession()
    const db = getDB()

    const rows = await db
      .select({
        id: tagsTable.id,
        name: tagsTable.name,
        pinned: tagsTable.pinned,
        sortOrder: tagsTable.sortOrder,
        color: tagsTable.color,
        lastUsedAt: tagsTable.lastUsedAt,
        bookmarkCount: sql<number>`count(${bookmarkTable.id})`.mapWith(Number)
      })
      .from(tagsTable)
      .leftJoin(bookmarkTagsTable, eq(bookmarkTagsTable.tagId, tagsTable.id))
      .leftJoin(
        bookmarkTable,
        and(eq(bookmarkTable.id, bookmarkTagsTable.bookmarkId), isNull(bookmarkTable.deletedAt))
      )
      .where(eq(tagsTable.userId, session.user.id))
      .groupBy(tagsTable.id)

    return rows
  }
)
