import type { CreateBookmarkCommand } from "@pantry/api-contract/schemas/bookmark-procedures";
import type {
  BookmarkId,
  BookmarkNote,
  BookmarkTitle,
  BookmarkUrl,
} from "@pantry/api-contract/schemas/bookmark-values";
import type { TagId } from "@pantry/api-contract/schemas/tag-values";

import type { UserId } from "../../../domain/user-id";
import { err, ok } from "../../../shared/result";
import type { Result } from "../../../shared/result";

export type { CreateBookmarkCommand } from "@pantry/api-contract/schemas/bookmark-procedures";

export interface CreatedBookmark {
  readonly id: BookmarkId;
}

/**
 * 呼び出し側が分岐できる失敗だけを Result に載せる。
 * transaction 内の未知障害は rollback のために throw のまま通す。
 */
export type CreateBookmarkError =
  | { readonly code: "duplicate-url" }
  | { readonly code: "invalid-tag" };

export interface InsertBookmarkInput {
  readonly userId: UserId;
  readonly url: BookmarkUrl;
  readonly title: BookmarkTitle;
  readonly note: BookmarkNote;
  readonly tagIds: readonly TagId[];
}

/**
 * CreateBookmark が永続化に求める能力だけ。transaction 境界も adapter の内部詳細。
 * `duplicate-url` / `invalid-tag` は制約や SQLite error の推測ではなく、
 * adapter が検証した結果として返す。
 */
export type InsertBookmarkOutput =
  | { readonly kind: "created"; readonly id: BookmarkId }
  | { readonly kind: "duplicate-url" }
  | { readonly kind: "invalid-tag" };

export type InsertBookmark = (
  input: InsertBookmarkInput
) => Promise<InsertBookmarkOutput>;

export const executeCreateBookmark = async (params: {
  readonly insertBookmark: InsertBookmark;
  readonly userId: UserId;
  readonly command: CreateBookmarkCommand;
}): Promise<Result<CreatedBookmark, CreateBookmarkError>> => {
  const output = await params.insertBookmark({
    note: params.command.note,
    tagIds: params.command.tags,
    title: params.command.title,
    url: params.command.url,
    userId: params.userId,
  });

  if (output.kind === "duplicate-url") {
    return err({ code: "duplicate-url" });
  }
  if (output.kind === "invalid-tag") {
    return err({ code: "invalid-tag" });
  }

  return ok({ id: output.id });
};
