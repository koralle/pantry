import * as v from "valibot";

export const bookmarkSearchSchema = v.object({
  q: v.optional(v.string()),
  sort: v.optional(v.picklist(["newest", "updated"]), "newest"),
  tagMode: v.optional(v.picklist(["and", "or"]), "and"),
  tags: v.optional(v.array(v.string())),
});

export type BookmarkSearchSchema = v.InferOutput<typeof bookmarkSearchSchema>;

/** 詳細・編集・新規に載せる一覧条件。既定値は省略し、一覧 URL へ戻すときに復元する。 */
export const bookmarkDetailSearchSchema = v.object({
  q: v.optional(v.string()),
  sort: v.optional(v.picklist(["newest", "updated"])),
  tagMode: v.optional(v.picklist(["and", "or"])),
  tags: v.optional(v.array(v.string())),
});

export type BookmarkDetailSearch = v.InferOutput<
  typeof bookmarkDetailSearchSchema
>;

export const defaultBookmarkSearch: BookmarkSearchSchema = {
  sort: "newest",
  tagMode: "and",
};
