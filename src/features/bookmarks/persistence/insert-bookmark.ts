import { and, eq, inArray } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import * as v from 'valibot'

import type { AppDb } from '../../../db/app-db'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { tagsTable } from '../../../db/schema/tag'
import type { InsertBookmarkInput, InsertBookmarkOutput } from '../application/create-bookmark'
import { bookmarkIdSchema } from '../domain/bookmark-values'

/**
 * 衝突と所有権の正本は DB 制約。
 * - `(userId, url)` を conflict target に `onConflictDoNothing` で insert し、
 *   returning が空なら業務上の URL 重複とみなす。事前 SELECT は、
 *   SELECT と INSERT の隙間に割り込まれて重複を見逃す。
 * - tag の存在と actor ownership は同一 transaction 内で検証し、
 *   別 user の tag を関連付けない。
 * - transaction 内の未知障害は rollback のために throw し、外側でも再 throw する。
 */
export async function insertBookmark(
  db: AppDb,
  input: InsertBookmarkInput
): Promise<InsertBookmarkOutput> {
  return db.transaction(async (tx) => {
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

    const inserted = await tx
        .insert(bookmarkTable)
        .values({
          id: uuidv7(),
          userId: input.userId,
          url: input.url,
          title: input.title,
          note: input.note
        })
        .onConflictDoNothing({
          target: [bookmarkTable.userId, bookmarkTable.url]
        })
        .returning({ id: bookmarkTable.id }),
      [created] = inserted
    if (created === undefined) {
      return { kind: 'duplicate-url' }
    }

    if (tagIds.length > 0) {
      await tx
        .insert(bookmarkTagsTable)
        .values(tagIds.map((tagId) => ({ bookmarkId: created.id, tagId })))
      await tx
        .update(tagsTable)
        .set({ lastUsedAt: new Date() })
        .where(and(eq(tagsTable.userId, input.userId), inArray(tagsTable.id, [...tagIds])))
    }

    return {
      kind: 'created',
      id: v.parse(bookmarkIdSchema, created.id)
    }
  })
}
