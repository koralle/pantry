import * as v from 'valibot'

export const httpUrlSchema = v.pipe(
  v.string(),
  v.url(),
  v.check((value) => {
    try {
      const { protocol } = new URL(value)

      return protocol === 'http:' || protocol === 'https:'
    } catch {
      return false
    }
  })
)

export const fetchBookmarkTitleInputSchema = v.object({
  url: httpUrlSchema
})

export const updateBookmarkInputSchema = v.object({
  id: v.string(),
  url: v.pipe(v.string(), v.url()),
  title: v.string(),
  note: v.nullable(v.string())
})
