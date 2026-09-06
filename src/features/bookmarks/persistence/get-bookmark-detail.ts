import { and, eq, isNull } from "drizzle-orm";

import type { AppDb } from "../../../db/app-db";
import { bookmarkTable } from "../../../db/schema/bookmark";
import { bookmarkTagsTable } from "../../../db/schema/bookmark-tag";
import { tagsTable } from "../../../db/schema/tag";
import type { UserId } from "../../auth/domain/auth-values";

/**
 * 詳細画面の screen projection。tagNames は tagIds を画面で組み立てさせないため、
 * ここで名前へ解決して返す。timestamp は wire 向けに ISO 文字列へ写す。
 */
export interface BookmarkDetail {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly note: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly tagNames: string[];
}

/** 対象なしは null。procedure が 404 defined error へ変換する。 */
export const getBookmarkDetail = async (
  db: AppDb,
  userId: UserId,
  input: { readonly id: string }
): Promise<BookmarkDetail | null> => {
  const [bookmark] = await db
    .select({
      createdAt: bookmarkTable.createdAt,
      id: bookmarkTable.id,
      note: bookmarkTable.note,
      title: bookmarkTable.title,
      updatedAt: bookmarkTable.updatedAt,
      url: bookmarkTable.url,
    })
    .from(bookmarkTable)
    .where(
      and(
        eq(bookmarkTable.id, input.id),
        eq(bookmarkTable.userId, userId),
        isNull(bookmarkTable.deletedAt)
      )
    )
    .limit(1);

  if (bookmark === null || bookmark === undefined) {
    return null;
  }

  const tagRows = await db
    .select({ name: tagsTable.name })
    .from(bookmarkTagsTable)
    .innerJoin(tagsTable, eq(bookmarkTagsTable.tagId, tagsTable.id))
    .where(
      and(
        eq(bookmarkTagsTable.bookmarkId, bookmark.id),
        eq(tagsTable.userId, userId)
      )
    )
    .orderBy(tagsTable.name);

  return {
    ...bookmark,
    createdAt: bookmark.createdAt.toISOString(),
    tagNames: tagRows.map((row) => row.name),
    updatedAt: bookmark.updatedAt.toISOString(),
  };
};
