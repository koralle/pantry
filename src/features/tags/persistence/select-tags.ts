import { asc, eq } from 'drizzle-orm'

import type { AppDb } from '../../../db/app-db'
import { tagsTable } from '../../../db/schema/tag'
import type { UserId } from '../../auth/domain/auth-values'

export type TagsListRow = {
  readonly id: number
  readonly name: string
}

/**
 * タグ紐付け表示など、id と名前だけあれば足りる読み取り。
 * offset 分割の安定のため id 順に固定する。
 */
export async function selectTags(
  db: AppDb,
  userId: UserId,
  page: { limit: number; offset: number }
): Promise<TagsListRow[]> {
  return db
    .select({ id: tagsTable.id, name: tagsTable.name })
    .from(tagsTable)
    .where(eq(tagsTable.userId, userId))
    .orderBy(asc(tagsTable.id))
    .limit(page.limit)
    .offset(page.offset)
}
