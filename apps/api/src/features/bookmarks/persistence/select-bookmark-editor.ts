import { bookmarkIdSchema } from "@pantry/api-contract/schemas/bookmark-values";
import type { AppDb } from "@pantry/db";
import { bookmarkTable } from "@pantry/db/schema/bookmark";
import { bookmarkTagsTable } from "@pantry/db/schema/bookmark-tag";
import { tagsTable } from "@pantry/db/schema/tag";
import { and, eq, isNull } from "drizzle-orm";
import * as v from "valibot";

import type { UserId } from "../../../domain/user-id";

/**
 * 編集画面に必要な projection だけを返す読み取り専用 query service。
 * 対象なし（未所有・削除済み含む）は null で返し、404 への変換は procedure の責務。
 */
export const selectBookmarkEditor = async (
  db: AppDb,
  userId: UserId,
  id: string
): Promise<{
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly note: string | null;
  readonly tagIds: number[];
} | null> => {
  const [row] = await db
    .select({
      note: bookmarkTable.note,
      title: bookmarkTable.title,
      url: bookmarkTable.url,
    })
    .from(bookmarkTable)
    .where(
      and(
        eq(bookmarkTable.id, id),
        eq(bookmarkTable.userId, userId),
        isNull(bookmarkTable.deletedAt)
      )
    )
    .limit(1);

  if (row === undefined) {
    return null;
  }

  const tagRows = await db
    .select({ tagId: tagsTable.id })
    .from(bookmarkTagsTable)
    .innerJoin(tagsTable, eq(bookmarkTagsTable.tagId, tagsTable.id))
    .where(
      and(eq(bookmarkTagsTable.bookmarkId, id), eq(tagsTable.userId, userId))
    );

  return {
    id: v.parse(bookmarkIdSchema, id),
    note: row.note,
    tagIds: tagRows.map((tagRow) => tagRow.tagId),
    title: row.title,
    url: row.url,
  };
};
