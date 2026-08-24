import { and, eq, isNull } from 'drizzle-orm'

import type { AppDb } from '../../../db/app-db'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { tagsTable } from '../../../db/schema/tag'
import type { UserId } from '../../auth/domain/auth-values'

/**
 * 詳細画面の screen projection。tagNames は tagIds を画面で組み立てさせないため、
 * ここで名前へ解決して返す。timestamp は wire 向けに ISO 文字列へ写す。
 */
export type BookmarkDetail = {
  readonly id: string
  readonly url: string
  readonly title: string
  readonly note: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly tagNames: string[]
}

/** 対象なしは null。procedure が 404 defined error へ変換する。 */
export async function getBookmarkDetail(
  db: AppDb,
  userId: UserId,
  input: { readonly id: string }
): Promise<BookmarkDetail | null> {
  const [bookmark] = await db
    .select({
      id: bookmarkTable.id,
      url: bookmarkTable.url,
      title: bookmarkTable.title,
      note: bookmarkTable.note,
      createdAt: bookmarkTable.createdAt,
      updatedAt: bookmarkTable.updatedAt
    })
    .from(bookmarkTable)
    .where(
      and(
        eq(bookmarkTable.id, input.id),
        eq(bookmarkTable.userId, userId),
        isNull(bookmarkTable.deletedAt)
      )
    )
    .limit(1)

  if (bookmark == null) {
    return null
  }

  const tagRows = await db
    .select({ name: tagsTable.name })
    .from(bookmarkTagsTable)
    .innerJoin(tagsTable, eq(bookmarkTagsTable.tagId, tagsTable.id))
    .where(and(eq(bookmarkTagsTable.bookmarkId, bookmark.id), eq(tagsTable.userId, userId)))
    .orderBy(tagsTable.name)

  return {
    ...bookmark,
    createdAt: bookmark.createdAt.toISOString(),
    updatedAt: bookmark.updatedAt.toISOString(),
    tagNames: tagRows.map((row) => row.name)
  }
}
