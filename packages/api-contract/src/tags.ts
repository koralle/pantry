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

export const tagsContract = {
  byId: authed
    .errors(tagNotFound)
    .input(tagByIdInputSchema)
    .output(tagRecordSchema),
  create: authed
    .errors(tagNameAlreadyExists)
    .input(createTagInputSchema)
    .output(tagIdOutputSchema),
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
  update: authed
    .errors({ ...tagNameAlreadyExists, ...tagNotFound })
    .input(updateTagInputSchema)
    .output(tagIdOutputSchema),
};
