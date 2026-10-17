import { and, eq, isNull, notExists, sql } from "drizzle-orm";

import type { AppDb } from "../../../db/app-db";
import { bookmarkTable } from "../../../db/schema/bookmark";
import { bookmarkTagsTable } from "../../../db/schema/bookmark-tag";
import { tagsTable } from "../../../db/schema/tag";
import type { UserId } from "../../auth/domain/auth-values";

export type BookmarkCountView = "favorites" | "inbox" | "recent";

/**
 * シェルのナビ表示数。一覧の view 条件と同じ定義を使い、指定された view の件数だけを数える。
 */
export const getBookmarkCount = async (
  db: AppDb,
  userId: UserId,
  view: BookmarkCountView
): Promise<number> => {
  const conditions = [
    eq(bookmarkTable.userId, userId),
    isNull(bookmarkTable.deletedAt),
  ];

  if (view === "favorites") {
    conditions.push(eq(bookmarkTable.favorite, true));
  } else if (view === "inbox") {
    conditions.push(
      notExists(
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
      )
    );
  }

  const [counts] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookmarkTable)
    .where(and(...conditions));

  return counts?.count ?? 0;
};
