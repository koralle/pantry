import type { UpdateBookmarkCommand } from "@pantry/api-contract/schemas/bookmark-procedures";
import type {
  BookmarkId,
  BookmarkNote,
  BookmarkTitle,
  BookmarkUrl,
} from "@pantry/api-contract/schemas/bookmark-values";
import type { TagId } from "@pantry/api-contract/schemas/tag-values";
import { err, ok } from "@pantry/utils/result";
import type { Result } from "@pantry/utils/result";

import type { UserId } from "../../../domain/user-id";
import { assertUniqueTagIds } from "../domain/bookmark";

export type { UpdateBookmarkCommand } from "@pantry/api-contract/schemas/bookmark-procedures";

export interface UpdatedBookmark {
  readonly id: BookmarkId;
}

/**
 * 呼び出し側が分岐できる失敗だけを Result に載せる。
 * 重複 tag ID は domain rule、tag の存在と所有は adapter の検証結果として invalid-tag に統一する。
 * transaction 内の未知障害は rollback のために throw のまま通す。
 */
export type UpdateBookmarkError =
  | { readonly code: "bookmark-not-found" }
  | { readonly code: "duplicate-url" }
  | { readonly code: "invalid-tag" };

export interface UpdateBookmarkInput {
  readonly userId: UserId;
  readonly bookmarkId: BookmarkId;
  readonly url: BookmarkUrl;
  readonly title: BookmarkTitle;
  readonly note: BookmarkNote;
  readonly tagIds: readonly TagId[];
}

/**
 * UpdateBookmark が永続化に求める能力だけ。transaction 境界も adapter の内部詳細。
 * `bookmark-not-found` / `duplicate-url` / `invalid-tag` は SQLite error や事前 SELECT の
 * 推測ではなく、adapter が検証した結果として返す。
 */
export type UpdateBookmarkOutput =
  | { readonly kind: "updated"; readonly id: BookmarkId }
  | { readonly kind: "bookmark-not-found" }
  | { readonly kind: "duplicate-url" }
  | { readonly kind: "invalid-tag" };

export type UpdateBookmark = (
  input: UpdateBookmarkInput
) => Promise<UpdateBookmarkOutput>;

export const executeUpdateBookmark = async (params: {
  readonly updateBookmark: UpdateBookmark;
  readonly userId: UserId;
  readonly command: UpdateBookmarkCommand;
}): Promise<Result<UpdatedBookmark, UpdateBookmarkError>> => {
  const uniqueTagIds = assertUniqueTagIds(params.command.tags);
  if (!uniqueTagIds.ok) {
    return err({ code: "invalid-tag" });
  }

  const output = await params.updateBookmark({
    bookmarkId: params.command.id,
    note: params.command.note,
    tagIds: uniqueTagIds.value,
    title: params.command.title,
    url: params.command.url,
    userId: params.userId,
  });

  if (output.kind === "updated") {
    return ok({ id: output.id });
  }

  return err({ code: output.kind });
};
