import * as v from 'valibot'

import type { AppDb } from '../../../db/app-db'
import { tagsTable } from '../../../db/schema/tag'
import type { InsertTagInput, InsertTagOutput } from '../application/create-tag'
import { tagIdSchema } from '../domain/tag-values'

/**
 * 同名判定の正本は `(userId, normalizedName)` の unique 制約。
 * 事前 SELECT は、SELECT と INSERT の隙間に割り込まれて重複を見逃す。
 * returning が空なら業務上の名前衝突とみなす。汎用 UNIQUE 判定に任せると、
 * 別制約の失敗まで「名前が既にある」に化けてしまう。
 */
export async function insertTag(db: AppDb, input: InsertTagInput): Promise<InsertTagOutput> {
  const inserted = await db
    .insert(tagsTable)
    .values({
      userId: input.userId,
      name: input.name.display,
      normalizedName: input.name.normalized,
      pinned: input.pinned,
      sortOrder: input.sortOrder,
      color: input.color
    })
    .onConflictDoNothing({
      target: [tagsTable.userId, tagsTable.normalizedName]
    })
    .returning({ id: tagsTable.id }),

   [created] = inserted
  if (created === undefined) {
    return { kind: 'name-conflict' }
  }

  return {
    kind: 'created',
    id: v.parse(tagIdSchema, created.id)
  }
}
