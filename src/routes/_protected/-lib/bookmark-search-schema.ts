import * as v from 'valibot'

export const bookmarkSearchSchema = v.object({
  q: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  tagMode: v.optional(v.picklist(['and', 'or']), 'and'),
  sort: v.optional(v.picklist(['newest', 'updated']), 'newest')
})

export type BookmarkSearchSchema = v.InferOutput<typeof bookmarkSearchSchema>
