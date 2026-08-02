import * as v from 'valibot'

import {
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from '../../domain/bookmark-values'

export const bookmarkFormSchema = v.object({
  url: bookmarkUrlSchema,
  title: bookmarkTitleSchema,
  note: bookmarkNoteSchema
})

export type BookmarkFormInput = v.InferInput<typeof bookmarkFormSchema>
export type BookmarkFormOutput = v.InferOutput<typeof bookmarkFormSchema>
