import * as v from "valibot";

import { authed } from "./base";
import { offsetPaginationQuerySchema } from "./schemas/pagination";
import {
  createTagInputSchema,
  deleteTagInputSchema,
  shelfTagSchema,
  tagByIdInputSchema,
  tagIdOutputSchema,
  tagRecordSchema,
  tagsListRowSchema,
  touchTagInputSchema,
  touchTagOutputSchema,
  updateTagInputSchema,
} from "./schemas/tag-procedures";

const tagNotFound = { "tag-not-found": { status: 404 } } as const;
const tagNameAlreadyExists = {
  "tag-name-already-exists": { status: 409 },
} as const;

/**
 * `tags.*`。どれもサインインが必要で、他ユーザーのタグは存在しないものとして扱う
 * （取得・更新・削除・touch は `tag-not-found`）。
 */
export const tagsContract = {
  byId: authed
    .errors(tagNotFound)
    .input(tagByIdInputSchema)
    .output(tagRecordSchema),
  create: authed
    .errors(tagNameAlreadyExists)
    .input(createTagInputSchema)
    .output(tagIdOutputSchema),
  /** 削除は紐付け解除込み。 */
  delete: authed
    .errors(tagNotFound)
    .input(deleteTagInputSchema)
    .output(tagIdOutputSchema),
  /** offset 分割の安定のため id 順に固定する。 */
  list: authed
    .input(offsetPaginationQuerySchema)
    .output(v.array(tagsListRowSchema)),
  shelf: authed.output(v.array(shelfTagSchema)),
  touch: authed
    .errors(tagNotFound)
    .input(touchTagInputSchema)
    .output(touchTagOutputSchema),
  /** full-replace。名前の衝突は `tag-name-already-exists`。 */
  update: authed
    .errors({ ...tagNameAlreadyExists, ...tagNotFound })
    .input(updateTagInputSchema)
    .output(tagIdOutputSchema),
};
