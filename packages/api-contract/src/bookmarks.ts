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

/** レールの view ごとの件数。件数の定義は api の persistence を正本にする。 */
const count = authed.output(v.number());

/**
 * `bookmarks.*`（`title` は外部 fetch なので web に残す）。どれもサインインが必要で、
 * 他ユーザーや削除済みの bookmark は存在しないもの（`bookmark-not-found`）として扱う。
 */
export const bookmarksContract = {
  counts: {
    favorites: count,
    inbox: count,
    recent: count,
  },
  /** 他ユーザーのタグや重複したタグは `invalid-tag`、同じ URL は `duplicate-url`。 */
  create: authed
    .errors(writeConflicts)
    .input(createBookmarkInputSchema)
    .output(bookmarkIdOutputSchema),
  /** soft delete。 */
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
  /** 新しい順。`nextCursor` を次の `cursor` に渡して続きを読む。 */
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
