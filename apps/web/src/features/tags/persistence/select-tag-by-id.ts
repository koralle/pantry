import { and, eq } from "drizzle-orm";

import type { AppDb } from "../../../db/app-db";
import { tagsTable } from "../../../db/schema/tag";
import type { UserId } from "../../auth/domain/auth-values";
import type { TagRecord } from "../lib/tag-shelf";

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
