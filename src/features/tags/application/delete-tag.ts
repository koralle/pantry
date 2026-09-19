import * as v from "valibot";

import { err, ok } from "../../../shared/domain/result";
import type { Result } from "../../../shared/domain/result";
import type { UserId } from "../../auth/domain/auth-values";
import { tagIdSchema } from "../domain/tag-values";
import type { TagId } from "../domain/tag-values";

/**
 * HTTP 直前の形。削除は id だけで確定する。
 */
export const deleteTagInputSchema = v.object({
  id: tagIdSchema,
});

export type DeleteTagValidatedInput = v.InferOutput<
  typeof deleteTagInputSchema
>;

export interface DeletedTag {
  readonly id: TagId;
}

/**
 * 呼び出し側が分岐できる失敗だけを Result に載せる。
 * 所有外・存在しないは `tag-not-found`。DB 障害のような想定外は throw のままにする。
 */
export interface DeleteTagError {
  readonly code: "tag-not-found";
}

export interface DeleteTagInput {
  readonly userId: UserId;
  readonly id: TagId;
}

/**
 * DeleteTag が永続化に求める能力だけ。汎用 TagRepository にしない。
 * `not-found` は推測ではなく、adapter が所有確認の結果として返す。
 */
export type DeleteTagOutput =
  | { readonly kind: "deleted" }
  | { readonly kind: "not-found" };

/**
 * Application が知る永続化は、この関数型だけ。
 */
export type DeleteTag = (input: DeleteTagInput) => Promise<DeleteTagOutput>;

/**
 * Drizzle も HTTP も知らない。port の `not-found` を業務エラーへ写すだけにする。
 */
export const executeDeleteTag = async (params: {
  readonly deleteTag: DeleteTag;
  readonly userId: UserId;
  readonly id: TagId;
}): Promise<Result<DeletedTag, DeleteTagError>> => {
  const output = await params.deleteTag({
    id: params.id,
    userId: params.userId,
  });

  if (output.kind === "not-found") {
    return err({ code: "tag-not-found" });
  }

  return ok({ id: params.id });
};
