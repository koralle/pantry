import type { TagRecord } from "@pantry/api-contract/schemas/tag-procedures";
import type { AppDb } from "@pantry/db";
import { tagsTable } from "@pantry/db/schema/tag";
import { and, eq } from "drizzle-orm";

import type { UserId } from "../../../../domain/user-id";

/**
 * 対象なしは null で返す。404 への変換は procedure の責務。
 */
export const selectTagById = async (
  db: AppDb,
  userId: UserId,
  id: number
): Promise<TagRecord | null> => {
  const [row] = await db
    .select({
      color: tagsTable.color,
      id: tagsTable.id,
      name: tagsTable.name,
      pinned: tagsTable.pinned,
      sortOrder: tagsTable.sortOrder,
    })
    .from(tagsTable)
    .where(and(eq(tagsTable.id, id), eq(tagsTable.userId, userId)))
    .limit(1);

  return row ?? null;
};
