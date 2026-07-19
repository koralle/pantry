import * as v from 'valibot'

export const addBookmarkInputSchema = v.object({
  url: v.pipe(v.string(), v.url()),
  title: v.string(),
  note: v.nullable(v.string()),
  tags: v.array(v.number())
})

export const updateBookmarkInputSchema = v.object({
  id: v.string(),
  url: v.pipe(v.string(), v.url()),
  title: v.string(),
  note: v.nullable(v.string()),
  tags: v.array(v.number())
})
