import { and, eq, sql } from 'drizzle-orm'
import * as v from 'valibot'

import type { AppDb } from '../../../db/app-db'
import { tagsTable } from '../../../db/schema/tag'
import type { UpdateTagInput, UpdateTagOutput } from '../application/update-tag'
import { tagIdSchema } from '../domain/tag-values'

/**
 * 同名判定の正本は `(userId, normalizedName)` の unique 制約。
 * 事前 SELECT で重複を弾くと、SELECT と UPDATE の隙間に割り込まれて衝突を見逃す。
 * `UPDATE OR IGNORE ... RETURNING` が空でも、直後に同一行を再 SELECT して理由を仕分ける。
 * 行が消えていれば削除との競合で 404、残っていれば名前衝突で 409 を返す。
 */
export async function updateTag(db: AppDb, input: UpdateTagInput): Promise<UpdateTagOutput> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(and(eq(tagsTable.id, input.id), eq(tagsTable.userId, input.userId)))
      .limit(1)

    if (existing === undefined) {
      return { kind: 'not-found' }
    }

    const [updated] = await tx.all<{ id: number }>(sql`
      UPDATE OR IGNORE tags
      SET name = ${input.name.display},
          normalized_name = ${input.name.normalized},
          pinned = ${input.pinned ? 1 : 0},
          sort_order = ${input.sortOrder},
          color = ${input.color},
          updated_at = (cast(unixepoch('subsecond') * 1000 as integer))
      WHERE id = ${input.id} AND user_id = ${input.userId}
      RETURNING id
    `)

    if (updated === undefined) {
      const [remaining] = await tx
        .select({ id: tagsTable.id })
        .from(tagsTable)
        .where(and(eq(tagsTable.id, input.id), eq(tagsTable.userId, input.userId)))
        .limit(1)

      if (remaining === undefined) {
        return { kind: 'not-found' }
      }

      return { kind: 'name-conflict' }
    }

    return { kind: 'updated', id: v.parse(tagIdSchema, updated.id) }
  })
}
