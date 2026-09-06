import { and, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";

import type { AppDb } from "../../../db/app-db";
import { bookmarkTable } from "../../../db/schema/bookmark";
import { bookmarkTagsTable } from "../../../db/schema/bookmark-tag";
import { tagsTable } from "../../../db/schema/tag";
import type { UserId } from "../../auth/domain/auth-values";
import type { BookmarkListTag } from "../lib/attach-bookmark-tags";
import { attachTagsToBookmarks } from "../lib/attach-bookmark-tags";
import {
  decodeBookmarkListCursor,
  encodeBookmarkListCursor,
} from "../lib/bookmark-list-cursor";
import { BOOKMARK_LIST_PAGE_SIZE } from "../lib/bookmark-list-page-size";
import { normalizeListQuery } from "../lib/normalize-bookmark-list-query";

/**
 * 一覧画面が要する screen projection。DB の行をそのまま出さず、
 * timestamp は wire 向けに ISO 文字列へ写す。
 */
export interface BookmarkListItem {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly note: string | null;
  readonly updatedAt: string;
  readonly tags: BookmarkListTag[];
}

export interface BookmarkListPage {
  readonly items: BookmarkListItem[];
  readonly nextCursor: string | null;
}

export type BookmarkListQuery = Parameters<typeof normalizeListQuery>[0];

export const listBookmarks = async (
  db: AppDb,
  input: { readonly userId: UserId } & BookmarkListQuery
): Promise<BookmarkListPage> => {
  const { q, tagNames, tagMode, sort, cursor } = normalizeListQuery(input);
  const { userId } = input;
  const decodedCursor =
    cursor === undefined ? null : decodeBookmarkListCursor(cursor);

  const conditions = [
    eq(bookmarkTable.userId, userId),
    isNull(bookmarkTable.deletedAt),
  ];

  if (q !== null && q !== undefined) {
    // ユーザー入力の % _ \ をリテラルとして扱わせる。LIKE のワイルドカード注入を潰す。
    const pattern = `%${q.replaceAll(/[\\%_]/g, String.raw`\$&`)}%`;
    conditions.push(
      or(
        sql`${bookmarkTable.title} like ${pattern} escape '\\'`,
        sql`${bookmarkTable.url} like ${pattern} escape '\\'`,
        sql`${bookmarkTable.note} like ${pattern} escape '\\'`
      )!
    );
  }

  if (tagNames !== null && tagNames !== undefined) {
    const taggedBookmarks = db
      .select({ bookmarkId: bookmarkTagsTable.bookmarkId })
      .from(bookmarkTagsTable)
      .innerJoin(tagsTable, eq(bookmarkTagsTable.tagId, tagsTable.id))
      .where(
        and(
          eq(tagsTable.userId, userId),
          inArray(tagsTable.normalizedName, tagNames)
        )
      )
      .groupBy(bookmarkTagsTable.bookmarkId);

    const matchingIds =
      tagMode === "and"
        ? taggedBookmarks.having(
            sql`count(distinct ${tagsTable.normalizedName}) = ${tagNames.length}`
          )
        : taggedBookmarks;

    conditions.push(inArray(bookmarkTable.id, matchingIds));
  }

  const sortColumn =
    sort === "newest" ? bookmarkTable.createdAt : bookmarkTable.updatedAt;

  if (decodedCursor !== null && decodedCursor !== undefined) {
    const cursorDate = new Date(decodedCursor.sortValueMs);
    conditions.push(
      or(
        lt(sortColumn, cursorDate),
        and(eq(sortColumn, cursorDate), lt(bookmarkTable.id, decodedCursor.id))
      )!
    );
  }

  const bookmarks = await db
    .select({
      createdAt: bookmarkTable.createdAt,
      id: bookmarkTable.id,
      note: bookmarkTable.note,
      title: bookmarkTable.title,
      updatedAt: bookmarkTable.updatedAt,
      url: bookmarkTable.url,
    })
    .from(bookmarkTable)
    .where(and(...conditions))
    .orderBy(desc(sortColumn), desc(bookmarkTable.id))
    .limit(BOOKMARK_LIST_PAGE_SIZE + 1);

  const hasMore = bookmarks.length > BOOKMARK_LIST_PAGE_SIZE;
  const pageRows = hasMore
    ? bookmarks.slice(0, BOOKMARK_LIST_PAGE_SIZE)
    : bookmarks;
  const lastRow = pageRows.at(-1);
  const nextCursor =
    hasMore && lastRow !== undefined
      ? encodeBookmarkListCursor({
          id: lastRow.id,
          sortValueMs: (sort === "newest"
            ? lastRow.createdAt
            : lastRow.updatedAt
          ).getTime(),
        })
      : null;

  if (pageRows.length === 0) {
    return { items: [], nextCursor: null };
  }

  const bookmarkIds = pageRows.map((bookmark) => bookmark.id);
  const tagRows = await db
    .select({
      bookmarkId: bookmarkTagsTable.bookmarkId,
      id: tagsTable.id,
      name: tagsTable.name,
    })
    .from(bookmarkTagsTable)
    .innerJoin(tagsTable, eq(bookmarkTagsTable.tagId, tagsTable.id))
    .where(
      and(
        eq(tagsTable.userId, userId),
        inArray(bookmarkTagsTable.bookmarkId, bookmarkIds)
      )
    )
    .orderBy(tagsTable.name);

  const attached = attachTagsToBookmarks(
    pageRows.map((bookmark) => ({
      id: bookmark.id,
      note: bookmark.note,
      title: bookmark.title,
      updatedAt: bookmark.updatedAt.toISOString(),
      url: bookmark.url,
    })),
    tagRows
  );

  return { items: attached, nextCursor };
};
