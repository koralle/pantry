import * as v from 'valibot'

import { offsetPaginationQuerySchema } from '../../../schemas/pagination'

export const bookmarkSearchSchema = v.object({
  ...offsetPaginationQuerySchema.entries,
  q: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  tagMode: v.optional(v.picklist(['and', 'or']), 'and'),
  sort: v.optional(v.picklist(['newest', 'updated']), 'newest')
})

export type BookmarkSearchSchema = v.InferOutput<typeof bookmarkSearchSchema>

export const defaultBookmarkSearch: BookmarkSearchSchema = {
  limit: 50,
  offset: 0,
  tagMode: 'and',
  sort: 'newest'
}
