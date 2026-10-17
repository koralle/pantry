import type { TagId } from "@pantry/api-contract/schemas/tag-values";

import type { UserId } from "../../../domain/user-id";
import { err, ok } from "../../../shared/result";
import type { Result } from "../../../shared/result";

export interface TouchTagError {
  readonly code: "tag-not-found";
}

export interface TouchTagInput {
  readonly userId: UserId;
  readonly id: TagId;
}

/**
 * TouchTag が永続化に求める能力だけ。汎用 TagRepository にしない。
 * adapter は actor の tag だけを update し、returning の有無を結果として返す。
 */
export type TouchTagOutput =
  | { readonly kind: "touched" }
  | { readonly kind: "not-found" };

export type TouchTag = (input: TouchTagInput) => Promise<TouchTagOutput>;

/**
 * Drizzle も HTTP も知らない。port の not-found を業務エラーへ写すだけにする。
 * 薄いのは意図で、Application テストから fluent API mock を消すための境界である。
 */
export const executeTouchTag = async (params: {
  readonly touchTag: TouchTag;
  readonly userId: UserId;
  readonly id: TagId;
}): Promise<Result<void, TouchTagError>> => {
  const output = await params.touchTag({
    id: params.id,
    userId: params.userId,
  });

  if (output.kind === "not-found") {
    return err({ code: "tag-not-found" });
  }

  return ok();
};
