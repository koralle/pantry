import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import * as v from 'valibot'

import type { AppDb } from '../../../db/app-db'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { tagsTable } from '../../../db/schema/tag'
import type { UpdateBookmarkInput, UpdateBookmarkOutput } from '../application/update-bookmark'
import { bookmarkIdSchema } from '../domain/bookmark-values'

/**
 * 衝突と所有権の正本は DB 制約と actor スコープの WHERE。
 * - 存在と actor ownership の SELECT は bookmark-not-found 判定にだけ使い、
 *   URL 重複の事前 SELECT は行わない。事前 SELECT は、SELECT と UPDATE の
 *   隙間に割り込まれて重複を見逃す。
 * - URL 更新は `UPDATE OR IGNORE ... RETURNING` で行い、存在する target の
 *   returning が空なら業務上の URL 重複とみなす。SQLite error code や
 *   message による分類はしない。
 * - bookmark-tag は全置換し、actor が所有する tag の lastUsedAt だけを更新する。
 * - transaction 内の未知障害は rollback のために throw し、外側でも再 throw する。
 */
export async function updateBookmark(
  db: AppDb,
  input: UpdateBookmarkInput
): Promise<UpdateBookmarkOutput> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: bookmarkTable.id })
      .from(bookmarkTable)
      .where(
        and(
          eq(bookmarkTable.id, input.bookmarkId),
          eq(bookmarkTable.userId, input.userId),
          isNull(bookmarkTable.deletedAt)
        )
      )
      .limit(1)

    if (existing === undefined) {
      return { kind: 'bookmark-not-found' }
    }

    const tagIds = [...new Set(input.tagIds)]
    if (tagIds.length > 0) {
      const owned = await tx
        .select({ id: tagsTable.id })
        .from(tagsTable)
        .where(and(eq(tagsTable.userId, input.userId), inArray(tagsTable.id, [...tagIds])))
      if (owned.length !== tagIds.length) {
        return { kind: 'invalid-tag' }
      }
    }

    const updatedRows = await tx.all<{ id: string }>(sql`
      UPDATE OR IGNORE bookmarks
      SET url = ${input.url},
          title = ${input.title},
          note = ${input.note},
          updated_at = (cast(unixepoch('subsecond') * 1000 as integer))
      WHERE id = ${input.bookmarkId} AND user_id = ${input.userId}
      RETURNING id
    `)

    if (updatedRows.length === 0) {
      return { kind: 'duplicate-url' }
    }

    await tx.delete(bookmarkTagsTable).where(eq(bookmarkTagsTable.bookmarkId, input.bookmarkId))

    if (tagIds.length > 0) {
      await tx
        .insert(bookmarkTagsTable)
        .values(tagIds.map((tagId) => ({ bookmarkId: input.bookmarkId, tagId })))
      await tx
        .update(tagsTable)
        .set({ lastUsedAt: new Date() })
        .where(and(eq(tagsTable.userId, input.userId), inArray(tagsTable.id, [...tagIds])))
    }

    return {
      kind: 'updated',
      id: v.parse(bookmarkIdSchema, input.bookmarkId)
    }
  })
}
