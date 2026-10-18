import * as v from "valibot";

import { authed } from "./base";
import {
  bookmarkDetailSchema,
  bookmarkEditorInputSchema,
  bookmarkEditorSchema,
  bookmarkIdInputSchema,
  bookmarkIdOutputSchema,
  bookmarkListInputSchema,
  bookmarkListPageSchema,
  createBookmarkInputSchema,
  setBookmarkFavoriteInputSchema,
  updateBookmarkInputSchema,
} from "./schemas/bookmark-procedures";

const bookmarkNotFound = { "bookmark-not-found": { status: 404 } } as const;
const writeConflicts = {
  "duplicate-url": { status: 409 },
  "invalid-tag": { status: 409 },
} as const;

const count = authed.output(v.number());

/** `title` は外部 fetch なので、ここに含めず web に残す。 */
export const bookmarksContract = {
  counts: {
    favorites: count,
    inbox: count,
    recent: count,
  },
  create: authed
    .errors(writeConflicts)
    .input(createBookmarkInputSchema)
    .output(bookmarkIdOutputSchema),
  delete: authed
    .errors(bookmarkNotFound)
    .input(bookmarkIdInputSchema)
    .output(bookmarkIdOutputSchema),
  detail: authed
    .errors(bookmarkNotFound)
    .input(bookmarkIdInputSchema)
    .output(bookmarkDetailSchema),
  editor: authed
    .errors(bookmarkNotFound)
    .input(bookmarkEditorInputSchema)
    .output(bookmarkEditorSchema),
  list: authed.input(bookmarkListInputSchema).output(bookmarkListPageSchema),
  setFavorite: authed
    .errors(bookmarkNotFound)
    .input(setBookmarkFavoriteInputSchema)
    .output(bookmarkIdOutputSchema),
  update: authed
    .errors({ ...bookmarkNotFound, ...writeConflicts })
    .input(updateBookmarkInputSchema)
    .output(bookmarkIdOutputSchema),
};
