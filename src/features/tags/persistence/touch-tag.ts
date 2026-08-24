import { and, eq } from 'drizzle-orm'

import type { AppDb } from '../../../db/app-db'
import { tagsTable } from '../../../db/schema/tag'
import type { TouchTagInput, TouchTagOutput } from '../application/touch-tag'

/**
 * 存在確認と actor スコープの確定を単一 UPDATE で済ませ、returning の有無を結果とする。
 * 先に存在 SELECT を挟むと、SELECT と UPDATE の隙間に削除が割り込める。
 * 単一 UPDATE なので並行呼び出しでも行は壊れず、削除済みなら 0 行で not-found になる。
 *
 * updatedAt / version を bump しないのは意図的: last_used_at は利用履歴であり内容変更ではないため、
 * 更新日時や楽観ロックの対象に含めない。
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
