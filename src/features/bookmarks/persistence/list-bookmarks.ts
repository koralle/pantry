import { and, desc, eq, inArray, isNull, like, or, sql } from 'drizzle-orm'

import type { AppDb } from '../../../db/app-db'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { tagsTable } from '../../../db/schema/tag'
import type { UserId } from '../../auth/domain/auth-values'
import type { BookmarkListTag } from '../lib/attach-bookmark-tags'
import { attachTagsToBookmarks } from '../lib/attach-bookmark-tags'
import { normalizeListQuery } from '../lib/normalize-bookmark-list-query'

/**
 * 一覧画面が要する screen projection。DB の行をそのまま出さず、
 * timestamp は wire 向けに ISO 文字列へ写す。
 */
export type BookmarkListItem = {
  readonly id: string
  readonly url: string
  readonly title: string
  readonly note: string | null
  readonly updatedAt: string
  readonly tags: BookmarkListTag[]
}

export type BookmarkListQuery = Parameters<typeof normalizeListQuery>[0]

export async function listBookmarks(
  db: AppDb,
  input: { readonly userId: UserId } & BookmarkListQuery
): Promise<BookmarkListItem[]> {
  const { q, tagNames, tagMode, sort, limit, offset } = normalizeListQuery(input)
  const {userId} = input

  const conditions = [eq(bookmarkTable.userId, userId), isNull(bookmarkTable.deletedAt)]

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
      .where(and(eq(tagsTable.userId, userId), inArray(tagsTable.normalizedName, tagNames)))
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
    .select({
      id: bookmarkTable.id,
      url: bookmarkTable.url,
      title: bookmarkTable.title,
      note: bookmarkTable.note,
      updatedAt: bookmarkTable.updatedAt
    })
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
    .where(and(eq(tagsTable.userId, userId), inArray(bookmarkTagsTable.bookmarkId, bookmarkIds)))
    .orderBy(tagsTable.name)

  const attached = attachTagsToBookmarks(
    bookmarks.map((bookmark) => ({ ...bookmark, updatedAt: bookmark.updatedAt.toISOString() })),
    tagRows
  )

  return attached
}
