import * as v from 'valibot'

export const httpUrlSchema = v.pipe(
  v.string(),
  v.url(),
  v.check((value) => {
    let protocol: string

    try {
      ;({ protocol } = new URL(value))
    } catch {
      return false
    }

    return protocol === 'http:' || protocol === 'https:'
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
