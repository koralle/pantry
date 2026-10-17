import { and, eq, isNull } from "drizzle-orm";

import type { AppDb } from "../../../db/app-db";
import { bookmarkTable } from "../../../db/schema/bookmark";
import type {
  SetBookmarkFavoriteInput,
  SetBookmarkFavoriteOutput,
} from "../application/set-bookmark-favorite";

/**
 * 事前 SELECT は行わない。actor と未削除条件を UPDATE の WHERE に載せ、
 * returning の有無だけで updated / not-found を決める。
 * 削除済み行は favorite も updatedAt も動かさない。
 */
export const setBookmarkFavorite = async (
  db: AppDb,
  input: SetBookmarkFavoriteInput
): Promise<SetBookmarkFavoriteOutput> => {
  const updated = await db
    .update(bookmarkTable)
    .set({ favorite: input.favorite, updatedAt: new Date() })
    .where(
      and(
        eq(bookmarkTable.id, input.id),
        eq(bookmarkTable.userId, input.userId),
        isNull(bookmarkTable.deletedAt)
      )
    )
    .returning({ id: bookmarkTable.id });
  const [row] = updated;

  if (row === undefined) {
    return { kind: "bookmark-not-found" };
  }

  return { id: row.id, kind: "updated" };
};
