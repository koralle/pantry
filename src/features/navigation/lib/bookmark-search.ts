import * as v from "valibot";

export const bookmarkSearchSchema = v.object({
  layout: v.optional(v.picklist(["rows", "cards"])),
  q: v.optional(v.string()),
  sort: v.optional(v.picklist(["newest", "updated"]), "newest"),
  tagMode: v.optional(v.picklist(["and", "or"]), "and"),
  tags: v.optional(v.array(v.string())),
  view: v.optional(
    v.fallback(v.picklist(["recent", "inbox", "favorites"]), "recent")
  ),
});

export type BookmarkSearchSchema = v.InferOutput<typeof bookmarkSearchSchema>;

/** 一覧 search の検証正本。`/bookmarks` 一覧と `/` 正規化リダイレクトの両ルートで共用する。 */
export const validateBookmarkSearch = (search: unknown): BookmarkSearchSchema =>
  v.parse(bookmarkSearchSchema, search);

/** 詳細・編集・新規に載せる一覧条件。既定値は省略し、一覧 URL へ戻すときに復元する。 */
export const bookmarkDetailSearchSchema = v.object({
  layout: v.optional(v.picklist(["rows", "cards"])),
  q: v.optional(v.string()),
  sort: v.optional(v.picklist(["newest", "updated"])),
  tagMode: v.optional(v.picklist(["and", "or"])),
  tags: v.optional(v.array(v.string())),
  view: v.optional(v.picklist(["recent", "inbox", "favorites"])),
});

export type BookmarkDetailSearch = v.InferOutput<
  typeof bookmarkDetailSearchSchema
>;

/** クイック追加画面の search。一覧条件の引き継ぎに加えて URL prefill を持つ。 */
export const bookmarkQuickAddSearchSchema = v.object({
  ...bookmarkDetailSearchSchema.entries,
  url: v.optional(v.string()),
});

export type BookmarkQuickAddSearch = v.InferOutput<
  typeof bookmarkQuickAddSearchSchema
>;

export const defaultBookmarkSearch: BookmarkSearchSchema = {
  sort: "newest",
  tagMode: "and",
};
