import * as v from "valibot";

import { decodeBookmarkListCursor } from "./bookmark-list-cursor";
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema,
} from "./bookmark-values";
import { tagIdSchema } from "./tag-values";

/** domain schema が URL protocol・非空 title・note 正規化を担うため、Application 側で二重に検証しない。 */
export const createBookmarkInputSchema = v.object({
  note: bookmarkNoteSchema,
  tags: v.array(tagIdSchema),
  title: bookmarkTitleSchema,
  url: bookmarkUrlSchema,
});

/** 省略と明示値の区別は schema 層で消えるため、validation 済み入力と Application のコマンドの間に変換点を置かない。 */
export type CreateBookmarkCommand = v.InferOutput<
  typeof createBookmarkInputSchema
>;

export const updateBookmarkInputSchema = v.object({
  id: bookmarkIdSchema,
  note: bookmarkNoteSchema,
  tags: v.array(tagIdSchema),
  title: bookmarkTitleSchema,
  url: bookmarkUrlSchema,
});

export type UpdateBookmarkCommand = v.InferOutput<
  typeof updateBookmarkInputSchema
>;

export const bookmarkEditorInputSchema = v.object({ id: bookmarkIdSchema });

export const bookmarkIdInputSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
});

export const setBookmarkFavoriteInputSchema = v.object({
  favorite: v.boolean(),
  id: v.pipe(v.string(), v.uuid()),
});

export const bookmarkListViewSchema = v.picklist([
  "recent",
  "inbox",
  "favorites",
]);

export const bookmarkListInputSchema = v.object({
  cursor: v.optional(
    v.pipe(
      v.string(),
      v.minLength(1),
      v.maxLength(200),
      v.check((value) => decodeBookmarkListCursor(value) != null)
    )
  ),
  tagNames: v.optional(v.pipe(v.array(v.string()), v.maxLength(20))),
  view: v.optional(bookmarkListViewSchema),
});

export const bookmarkEditorSchema = v.object({
  id: v.string(),
  note: v.nullable(v.string()),
  tagIds: v.array(v.number()),
  title: v.string(),
  url: v.string(),
});

export type BookmarkEditor = v.InferOutput<typeof bookmarkEditorSchema>;

export const bookmarkListTagSchema = v.object({
  color: v.nullable(v.string()),
  id: v.number(),
  name: v.string(),
});

export type BookmarkListTag = v.InferOutput<typeof bookmarkListTagSchema>;

export const bookmarkListItemSchema = v.object({
  createdAt: v.string(),
  favorite: v.boolean(),
  id: v.string(),
  note: v.nullable(v.string()),
  tags: v.array(bookmarkListTagSchema),
  title: v.string(),
  updatedAt: v.string(),
  url: v.string(),
});

export type BookmarkListItem = v.InferOutput<typeof bookmarkListItemSchema>;

export const bookmarkListPageSchema = v.object({
  items: v.array(bookmarkListItemSchema),
  nextCursor: v.nullable(v.string()),
});

export type BookmarkListPage = v.InferOutput<typeof bookmarkListPageSchema>;

/** tagNames を api が名前へ解決して返すのは、tagIds から画面で組み立てさせないため。 */
export const bookmarkDetailSchema = v.object({
  createdAt: v.string(),
  favorite: v.boolean(),
  id: v.string(),
  note: v.nullable(v.string()),
  tagNames: v.array(v.string()),
  title: v.string(),
  updatedAt: v.string(),
  url: v.string(),
});

export type BookmarkDetail = v.InferOutput<typeof bookmarkDetailSchema>;

/** client へ branded `BookmarkId` を出すと、画面が Domain の組み立てを知っていることになるため plain な string にする。 */
export const bookmarkIdOutputSchema = v.object({ id: v.string() });
