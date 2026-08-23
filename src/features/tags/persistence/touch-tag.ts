import { and, eq } from 'drizzle-orm'

import type { AppDb } from '../../../db/app-db'
import { tagsTable } from '../../../db/schema/tag'
import type { TouchTagInput, TouchTagOutput } from '../application/touch-tag'

/**
 * 同一 UPDATE 内で actor スコープを確定させ、returning の有無を結果とする。
 * 先に存在 SELECT を挟むと、SELECT と UPDATE の隙間に削除が割り込める。
 */
export async function touchTag(db: AppDb, input: TouchTagInput): Promise<TouchTagOutput> {
  const updated = await db
    .update(tagsTable)
    .set({ lastUsedAt: new Date() })
    .where(and(eq(tagsTable.id, input.id), eq(tagsTable.userId, input.userId)))
    .returning({ id: tagsTable.id })

  if (updated.length === 0) {
    return { kind: 'not-found' }
  }

  return { kind: 'touched' }
}
