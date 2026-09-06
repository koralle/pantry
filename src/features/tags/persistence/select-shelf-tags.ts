import { and, eq, isNull, sql } from "drizzle-orm";

import type { AppDb } from "../../../db/app-db";
import { bookmarkTable } from "../../../db/schema/bookmark";
import { bookmarkTagsTable } from "../../../db/schema/bookmark-tag";
import { tagsTable } from "../../../db/schema/tag";
import type { UserId } from "../../auth/domain/auth-values";
import type { ShelfTag } from "../lib/tag-shelf";

/**
 * 棚（sidebar・mobile shelf・タグ管理）が使う行。削除済み bookmark は数えない。
 */
export const selectShelfTags = async (
  db: AppDb,
  userId: UserId
): Promise<ShelfTag[]> => {
  const rows = await db
    .select({
      bookmarkCount: sql<number>`count(${bookmarkTable.id})`.mapWith(Number),
      color: tagsTable.color,
      id: tagsTable.id,
      lastUsedAt: tagsTable.lastUsedAt,
      name: tagsTable.name,
      pinned: tagsTable.pinned,
      sortOrder: tagsTable.sortOrder,
    })
    .from(tagsTable)
    .leftJoin(bookmarkTagsTable, eq(bookmarkTagsTable.tagId, tagsTable.id))
    .leftJoin(
      bookmarkTable,
      and(
        eq(bookmarkTable.id, bookmarkTagsTable.bookmarkId),
        eq(bookmarkTable.userId, userId),
        isNull(bookmarkTable.deletedAt)
      )
    )
    .where(eq(tagsTable.userId, userId))
    .groupBy(tagsTable.id);

  return rows;
};
