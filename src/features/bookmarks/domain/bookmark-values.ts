import * as v from 'valibot'

export const bookmarkIdSchema = v.pipe(
  v.string(),
  v.uuid(),
  v.check((value) => value[14] === '7', 'UUID v7 を指定してください'),
  v.brand('BookmarkId')
)

export type BookmarkId = v.InferOutput<typeof bookmarkIdSchema>

export const bookmarkUrlSchema = v.pipe(
  v.string(),
  v.url('有効なURLを入力してください'),
  v.check((value) => {
    try {
      const { protocol } = new URL(value)
      return protocol === 'http:' || protocol === 'https:'
    } catch {
      return false
    }
  }, 'http または https の URL を入力してください'),
  v.brand('BookmarkUrl')
)

export type BookmarkUrl = v.InferOutput<typeof bookmarkUrlSchema>

export const bookmarkTitleSchema = v.pipe(
  v.string(),
  v.check((value) => value.trim().length > 0, 'タイトルを入力してください'),
  v.brand('BookmarkTitle')
)

export type BookmarkTitle = v.InferOutput<typeof bookmarkTitleSchema>

export const bookmarkNoteSchema = v.pipe(
  v.nullable(v.string()),
  v.transform((value) => {
    if (value == null) {
      return null
    }
    return value.trim() === '' ? null : value
  }),
  v.brand('BookmarkNote')
)

export type BookmarkNote = v.InferOutput<typeof bookmarkNoteSchema>
