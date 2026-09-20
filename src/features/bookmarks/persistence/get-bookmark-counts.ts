import { and, eq, isNull, notExists, sql } from "drizzle-orm";

import type { AppDb } from "../../../db/app-db";
import { bookmarkTable } from "../../../db/schema/bookmark";
import { bookmarkTagsTable } from "../../../db/schema/bookmark-tag";
import { tagsTable } from "../../../db/schema/tag";
import type { UserId } from "../../auth/domain/auth-values";

export interface BookmarkViewCounts {
  readonly recent: number;
  readonly inbox: number;
  readonly favorites: number;
}

/**
 * シェルのナビ表示数。一覧の view 条件と同じ定義で件数だけを数える。
 */
export const getBookmarkCounts = async (
  db: AppDb,
  userId: UserId
): Promise<BookmarkViewCounts> => {
  const baseConditions = and(
    eq(bookmarkTable.userId, userId),
    isNull(bookmarkTable.deletedAt)
  );

  const untagged = notExists(
    db
      .select({ bookmarkId: bookmarkTagsTable.bookmarkId })
      .from(bookmarkTagsTable)
      .innerJoin(tagsTable, eq(bookmarkTagsTable.tagId, tagsTable.id))
      .where(
        and(
          eq(tagsTable.userId, userId),
          eq(bookmarkTagsTable.bookmarkId, bookmarkTable.id)
        )
      )
  );

  const [counts] = await db
    .select({
      favorites: sql<number>`count(${bookmarkTable.favorite}) filter (where ${bookmarkTable.favorite})`,
      inbox: sql<number>`count(*) filter (where ${untagged})`,
      recent: sql<number>`count(*)`,
    })
    .from(bookmarkTable)
    .where(baseConditions);

  return {
    favorites: counts?.favorites ?? 0,
    inbox: counts?.inbox ?? 0,
    recent: counts?.recent ?? 0,
  };
};
