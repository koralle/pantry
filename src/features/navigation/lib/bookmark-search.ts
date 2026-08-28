import * as v from 'valibot'

export const bookmarkSearchSchema = v.object({
  q: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  tagMode: v.optional(v.picklist(['and', 'or']), 'and'),
  sort: v.optional(v.picklist(['newest', 'updated']), 'newest')
})

export type BookmarkSearchSchema = v.InferOutput<typeof bookmarkSearchSchema>

/** 詳細・編集・新規に載せる一覧条件。既定値は省略し、一覧 URL へ戻すときに復元する。 */
export const bookmarkDetailSearchSchema = v.object({
  q: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  tagMode: v.optional(v.picklist(['and', 'or'])),
  sort: v.optional(v.picklist(['newest', 'updated']))
})

export type BookmarkDetailSearch = v.InferOutput<typeof bookmarkDetailSearchSchema>

export const defaultBookmarkSearch: BookmarkSearchSchema = {
  tagMode: 'and',
  sort: 'newest'
}
