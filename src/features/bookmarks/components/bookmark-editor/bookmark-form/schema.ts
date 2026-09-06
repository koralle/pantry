import * as v from "valibot";

import {
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema,
} from "../../../domain/bookmark-values";

export const bookmarkFormSchema = v.object({
  note: bookmarkNoteSchema,
  title: bookmarkTitleSchema,
  url: bookmarkUrlSchema,
});

export type BookmarkFormInput = v.InferInput<typeof bookmarkFormSchema>;
export type BookmarkFormOutput = v.InferOutput<typeof bookmarkFormSchema>;
