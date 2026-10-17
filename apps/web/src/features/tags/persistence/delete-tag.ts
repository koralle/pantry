import { and, eq } from "drizzle-orm";

import type { AppDb } from "../../../db/app-db";
import { bookmarkTagsTable } from "../../../db/schema/bookmark-tag";
import { tagsTable } from "../../../db/schema/tag";
import type {
  DeleteTagInput,
  DeleteTagOutput,
} from "../application/delete-tag";

/**
 * タグの削除と紐付け解除を同一 transaction で確定させる。
 * FK cascade の有効性に依存せず、所有確認 → 紐付け削除 → 本体削除の順で行う。
 * 他人の tag_id を狙っても所有確認で先に弾くため、bookmark_tags は消えない。
 */
export const deleteTag = async (
  db: AppDb,
  input: DeleteTagInput
): Promise<DeleteTagOutput> =>
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(
        and(eq(tagsTable.id, input.id), eq(tagsTable.userId, input.userId))
      )
      .limit(1);

    if (existing === undefined) {
      return { kind: "not-found" };
    }

    await tx
      .delete(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.tagId, input.id));

    await tx
      .delete(tagsTable)
      .where(
        and(eq(tagsTable.id, input.id), eq(tagsTable.userId, input.userId))
      );

    return { kind: "deleted" };
  });
