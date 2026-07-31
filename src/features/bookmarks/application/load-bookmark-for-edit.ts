import { and, eq, isNull } from 'drizzle-orm'
import * as v from 'valibot'

import type { AppDb } from '../../../db/app-db'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
import type { UserId } from '../../auth/domain/auth-values'
import { tagIdSchema } from '../../tags/domain/tag-values'
import type { TagId } from '../../tags/domain/tag-values'
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from '../domain/bookmark-values'
import type {
  BookmarkId,
  BookmarkNote,
  BookmarkTitle,
  BookmarkUrl
} from '../domain/bookmark-values'

export type BookmarkEditorData = {
  readonly bookmarkId: BookmarkId
  readonly url: BookmarkUrl
  readonly title: BookmarkTitle
  readonly note: BookmarkNote
  readonly tagIds: readonly TagId[]
}

export type LoadBookmarkForEditError =
  | { readonly code: 'bookmark-not-found' }
  | { readonly code: 'unexpected-error' }

export type LoadBookmarkForEditResult = Result<BookmarkEditorData, LoadBookmarkForEditError>

export async function loadBookmarkForEdit(params: {
  readonly db: AppDb
  readonly actorId: UserId
  readonly bookmarkId: BookmarkId
}): Promise<LoadBookmarkForEditResult> {
  const { db, actorId, bookmarkId } = params

  try {
    const [row] = await db
      .select({
        id: bookmarkTable.id,
        url: bookmarkTable.url,
        title: bookmarkTable.title,
        note: bookmarkTable.note
      })
      .from(bookmarkTable)
      .where(
        and(
          eq(bookmarkTable.id, bookmarkId),
          eq(bookmarkTable.userId, actorId),
          isNull(bookmarkTable.deletedAt)
        )
      )
      .limit(1)

    if (row === null || row === undefined) {
      return err({ code: 'bookmark-not-found' })
    }

    const tagRows = await db
      .select({ tagId: bookmarkTagsTable.tagId })
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmarkId, row.id))

    const parsedId = v.safeParse(bookmarkIdSchema, row.id)
    const parsedUrl = v.safeParse(bookmarkUrlSchema, row.url)
    const parsedTitle = v.safeParse(bookmarkTitleSchema, row.title)
    const parsedNote = v.safeParse(bookmarkNoteSchema, row.note)

    if (!parsedId.success || !parsedUrl.success || !parsedTitle.success || !parsedNote.success) {
      return err({ code: 'unexpected-error' })
    }

    const tagIds: TagId[] = []
    for (const tagRow of tagRows) {
      const parsedTagId = v.safeParse(tagIdSchema, tagRow.tagId)
      if (!parsedTagId.success) {
        return err({ code: 'unexpected-error' })
      }
      tagIds.push(parsedTagId.output)
    }

    return ok({
      bookmarkId: parsedId.output,
      url: parsedUrl.output,
      title: parsedTitle.output,
      note: parsedNote.output,
      tagIds
    })
  } catch {
    return err({ code: 'unexpected-error' })
  }
}
