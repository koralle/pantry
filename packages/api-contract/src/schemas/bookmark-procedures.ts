import * as v from "valibot";

import { decodeBookmarkListCursor } from "./bookmark-list-cursor";
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema,
} from "./bookmark-values";
import { tagIdSchema } from "./tag-values";

/**
 * CreateBookmark の HTTP 直前の形。domain schema が URL protocol・非空 title・note 正規化を担うため、
 * Application 側で二重に検証しない。
 */
export const createBookmarkInputSchema = v.object({
  note: bookmarkNoteSchema,
  tags: v.array(tagIdSchema),
  title: bookmarkTitleSchema,
  url: bookmarkUrlSchema,
});

/**
 * Procedure の validation 済み入力が、そのまま Application へ渡る確定コマンドになる。
 * 省略と明示値の区別は schema 層で消えるため、変換点は置かない。
 */
export type CreateBookmarkCommand = v.InferOutput<
  typeof createBookmarkInputSchema
>;

/** UpdateBookmark の HTTP 直前の形。full-replace で、タグも丸ごと置き換える。 */
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

/** Id は wire 上では UUID 文字列。空文字や任意文字列をここで拒否する。 */
export const bookmarkIdInputSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
});

/** favorite はトグル先を input が持つ。 */
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

/** 編集画面に必要な projection。branded な型は wire output に残さない。 */
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

/**
 * 一覧画面が要する screen projection。DB の行をそのまま出さず、
 * timestamp は wire 向けに ISO 文字列へ写す。
 */
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

/**
 * 詳細画面の screen projection。tagNames は tagIds を画面で組み立てさせないため、
 * api が名前へ解決して返す。timestamp は wire 向けに ISO 文字列へ写す。
 */
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

/** 作成・更新・削除・favorite の成功形。branded `BookmarkId` は wire output に残さない。 */
export const bookmarkIdOutputSchema = v.object({ id: v.string() });
