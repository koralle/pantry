import { and, eq, isNull } from 'drizzle-orm'

import type { AppDb } from '../../../db/app-db'
import { bookmarkTable } from '../../../db/schema/bookmark'
import type {
  SoftDeleteBookmarkInput,
  SoftDeleteBookmarkOutput
} from '../application/delete-bookmark'

/**
 * 事前 SELECT は行わない。actor と未削除条件を UPDATE の WHERE に載せ、
 * returning の有無だけで deleted / not-found を決める。
 * 削除済み行は updatedAt も動かさない。
 */
export async function softDeleteBookmark(
  db: AppDb,
  input: SoftDeleteBookmarkInput
): Promise<SoftDeleteBookmarkOutput> {
  const now = new Date()
  const updated = await db
    .update(bookmarkTable)
    .set({ deletedAt: now, updatedAt: now })
    .where(
      and(
        eq(bookmarkTable.id, input.id),
        eq(bookmarkTable.userId, input.userId),
        isNull(bookmarkTable.deletedAt)
      )
    )
    .returning({ id: bookmarkTable.id })
  const [row] = updated

  if (row === undefined) {
    return { kind: 'bookmark-not-found' }
  }

  return { kind: 'deleted', id: row.id }
}
