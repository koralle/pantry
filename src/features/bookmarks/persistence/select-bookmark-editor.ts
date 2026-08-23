import { and, eq, isNull } from 'drizzle-orm'
import * as v from 'valibot'

import type { AppDb } from '../../../db/app-db'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import type { UserId } from '../../auth/domain/auth-values'
import { bookmarkIdSchema } from '../domain/bookmark-values'

/**
 * 編集画面に必要な projection だけを返す読み取り専用 query service。
 * 対象なし（未所有・削除済み含む）は null で返し、404 への変換は procedure の責務。
 */
export async function selectBookmarkEditor(
  db: AppDb,
  userId: UserId,
  id: string
): Promise<{
  readonly id: string
  readonly url: string
  readonly title: string
  readonly note: string | null
  readonly tagIds: number[]
} | null> {
  const [row] = await db
    .select({
      url: bookmarkTable.url,
      title: bookmarkTable.title,
      note: bookmarkTable.note
    })
    .from(bookmarkTable)
    .where(
      and(
        eq(bookmarkTable.id, id),
        eq(bookmarkTable.userId, userId),
        isNull(bookmarkTable.deletedAt)
      )
    )
    .limit(1)

  if (row === undefined) {
    return null
  }

  const tagRows = await db
    .select({ tagId: bookmarkTagsTable.tagId })
    .from(bookmarkTagsTable)
    .where(eq(bookmarkTagsTable.bookmarkId, id))

  return {
    id: v.parse(bookmarkIdSchema, id),
    url: row.url,
    title: row.title,
    note: row.note,
    tagIds: tagRows.map((tagRow) => tagRow.tagId)
  }
}
