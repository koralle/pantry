import { and, desc, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm'

import type { AppDb } from '../../../db/app-db'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { tagsTable } from '../../../db/schema/tag'
import type { UserId } from '../../auth/domain/auth-values'
import type { BookmarkListTag } from '../lib/attach-bookmark-tags'
import { attachTagsToBookmarks } from '../lib/attach-bookmark-tags'
import { decodeBookmarkListCursor, encodeBookmarkListCursor } from '../lib/bookmark-list-cursor'
import { BOOKMARK_LIST_PAGE_SIZE } from '../lib/bookmark-list-page-size'
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

export type BookmarkListPage = {
  readonly items: BookmarkListItem[]
  readonly nextCursor: string | null
}

export type BookmarkListQuery = Parameters<typeof normalizeListQuery>[0]

export async function listBookmarks(
  db: AppDb,
  input: { readonly userId: UserId } & BookmarkListQuery
): Promise<BookmarkListPage> {
  const { q, tagNames, tagMode, sort, cursor } = normalizeListQuery(input)
  const { userId } = input
  const decodedCursor = cursor === undefined ? null : decodeBookmarkListCursor(cursor)

  const conditions = [eq(bookmarkTable.userId, userId), isNull(bookmarkTable.deletedAt)]

  if (q != null) {
    // ユーザー入力の % _ \ をリテラルとして扱わせる。LIKE のワイルドカード注入を潰す。
    const pattern = `%${q.replace(/[\\%_]/g, String.raw`\$&`)}%`
    conditions.push(
      or(
        sql`${bookmarkTable.title} like ${pattern} escape '\\'`,
        sql`${bookmarkTable.url} like ${pattern} escape '\\'`,
        sql`${bookmarkTable.note} like ${pattern} escape '\\'`
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

  const sortColumn = sort === 'newest' ? bookmarkTable.createdAt : bookmarkTable.updatedAt

  if (decodedCursor != null) {
    const cursorDate = new Date(decodedCursor.sortValueMs)
    conditions.push(
      or(
        lt(sortColumn, cursorDate),
        and(eq(sortColumn, cursorDate), lt(bookmarkTable.id, decodedCursor.id))
      )!
    )
  }

  const bookmarks = await db
    .select({
      id: bookmarkTable.id,
      url: bookmarkTable.url,
      title: bookmarkTable.title,
      note: bookmarkTable.note,
      createdAt: bookmarkTable.createdAt,
      updatedAt: bookmarkTable.updatedAt
    })
    .from(bookmarkTable)
    .where(and(...conditions))
    .orderBy(desc(sortColumn), desc(bookmarkTable.id))
    .limit(BOOKMARK_LIST_PAGE_SIZE + 1)

  const hasMore = bookmarks.length > BOOKMARK_LIST_PAGE_SIZE
  const pageRows = hasMore ? bookmarks.slice(0, BOOKMARK_LIST_PAGE_SIZE) : bookmarks
  const lastRow = pageRows.at(-1)
  const nextCursor =
    hasMore && lastRow !== undefined
      ? encodeBookmarkListCursor({
          sortValueMs: (sort === 'newest' ? lastRow.createdAt : lastRow.updatedAt).getTime(),
          id: lastRow.id
        })
      : null

  if (pageRows.length === 0) {
    return { items: [], nextCursor: null }
  }

  const bookmarkIds = pageRows.map((bookmark) => bookmark.id)
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
    pageRows.map((bookmark) => ({
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      note: bookmark.note,
      updatedAt: bookmark.updatedAt.toISOString()
    })),
    tagRows
  )

  return { items: attached, nextCursor }
}
