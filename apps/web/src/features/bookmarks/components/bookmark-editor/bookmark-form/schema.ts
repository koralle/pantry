import {
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema,
} from "@pantry/api-contract/schemas/bookmark-values";
import * as v from "valibot";

export const bookmarkFormSchema = v.object({
  note: bookmarkNoteSchema,
  title: bookmarkTitleSchema,
  url: bookmarkUrlSchema,
});

export type BookmarkFormInput = v.InferInput<typeof bookmarkFormSchema>;
export type BookmarkFormOutput = v.InferOutput<typeof bookmarkFormSchema>;
