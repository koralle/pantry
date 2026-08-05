import { uuidv7 } from 'uuidv7'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { tagIdSchema } from '../../../tags/domain/tag-values'
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from '../../domain/bookmark-values'
import { buildUpdateBookmarkCommand } from './bookmark-editor-command'

describe('buildUpdateBookmarkCommand', () => {
  test('編集では既存のタグIDをそのまま送る', () => {
    const initialData = {
      bookmarkId: v.parse(bookmarkIdSchema, uuidv7()),
      url: v.parse(bookmarkUrlSchema, 'https://example.com/original'),
      title: v.parse(bookmarkTitleSchema, 'Original'),
      note: v.parse(bookmarkNoteSchema, 'Original note'),
      tagIds: [v.parse(tagIdSchema, 1), v.parse(tagIdSchema, 2)]
    }

    expect(
      buildUpdateBookmarkCommand(initialData, {
        url: initialData.url,
        title: initialData.title,
        note: initialData.note
      })
    ).toStrictEqual({
      bookmarkId: initialData.bookmarkId,
      url: initialData.url,
      title: initialData.title,
      note: initialData.note,
      tagIds: initialData.tagIds
    })
  })
})
