import { ErrorFactory } from '@praha/error-factory'
import { and, eq, inArray, isNull } from 'drizzle-orm'

import type { AppDb } from '../../../db/app-db'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { tagsTable } from '../../../db/schema/tag'
import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
import type { UserId } from '../../auth/domain/auth-values'
import type { TagId } from '../../tags/domain/tag-values'
import { assertUniqueTagIds } from '../domain/bookmark'
import type {
  BookmarkId,
  BookmarkNote,
  BookmarkTitle,
  BookmarkUrl
} from '../domain/bookmark-values'

export type UpdateBookmarkCommand = {
  readonly bookmarkId: BookmarkId
  readonly url: BookmarkUrl
  readonly title: BookmarkTitle
  readonly note: BookmarkNote
  readonly tagIds: readonly TagId[]
}

export type InvalidTagCause =
  | { readonly code: 'tag-not-found'; readonly tagId: TagId }
  | { readonly code: 'tag-not-owned'; readonly tagId: TagId }

export type UpdateBookmarkError =
  | { readonly code: 'bookmark-not-found' }
  | { readonly code: 'duplicate-url' }
  | { readonly code: 'invalid-title'; readonly field: 'title' }
  | { readonly code: 'invalid-url'; readonly field: 'url' }
  | {
      readonly code: 'duplicate-tag-id'
      readonly field: 'tags'
      readonly tagId: TagId
    }
  | {
      readonly code: 'invalid-tag'
      readonly field: 'tags'
      readonly cause: InvalidTagCause
    }
  | { readonly code: 'unexpected-error' }

export type UpdateBookmarkResult = Result<{ readonly bookmarkId: BookmarkId }, UpdateBookmarkError>

/** UI / Server Function 注入用。db と actorId は境界側で束縛済み。 */
export type ExecuteUpdateBookmark = (
  command: UpdateBookmarkCommand
) => Promise<UpdateBookmarkResult>

/**
 * DB 書き込み失敗は transaction 内で throw して rollback させ、外側で Result に変換する。
 * この throw は業務エラーの分岐ではなく、Drizzle / libsql の rollback adapter として使う。
 * 業務ルール違反は throw せず Result.err を返す（読み取りのみなら空 commit で問題ない）。
 */
class UpdateBookmarkWriteError extends ErrorFactory({
  name: 'UpdateBookmarkWriteError',
  message: 'ブックマーク更新の書き込みに失敗しました',
  fields: ErrorFactory.fields<{
    reason: unknown
  }>()
}) {}

class DuplicateUrlConstraintError extends ErrorFactory({
  name: 'DuplicateUrlConstraintError',
  message: 'URL が一意制約に違反しました'
}) {}

function isUniqueConstraintError(error: unknown): boolean {
  let current: unknown = error
  while (current !== null && current !== undefined && typeof current === 'object') {
    if ('code' in current && typeof current.code === 'string') {
      if (
        current.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        current.code === 'SQLITE_CONSTRAINT' ||
        current.code.includes('CONSTRAINT_UNIQUE')
      ) {
        return true
      }
    }
    if (!('cause' in current)) {
      break
    }
    current = current.cause
  }
  return false
}

export async function executeUpdateBookmark(params: {
  readonly db: AppDb
  readonly actorId: UserId
  readonly command: UpdateBookmarkCommand
}): Promise<UpdateBookmarkResult> {
  const { db, actorId, command } = params
  const { bookmarkId, url, title, note, tagIds } = command

  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: bookmarkTable.id,
          deletedAt: bookmarkTable.deletedAt
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

      if (existing === null || existing === undefined) {
        return err({ code: 'bookmark-not-found' })
      }

      const [duplicate] = await tx
        .select({ id: bookmarkTable.id })
        .from(bookmarkTable)
        .where(and(eq(bookmarkTable.userId, actorId), eq(bookmarkTable.url, url)))
        .limit(1)

      if (duplicate !== null && duplicate !== undefined && duplicate.id !== bookmarkId) {
        return err({ code: 'duplicate-url' })
      }

      const uniqueTagIds = assertUniqueTagIds(tagIds)
      if (!uniqueTagIds.ok) {
        return err(uniqueTagIds.error)
      }

      if (tagIds.length > 0) {
        const tagRows = await tx
          .select({
            id: tagsTable.id,
            userId: tagsTable.userId
          })
          .from(tagsTable)
          .where(inArray(tagsTable.id, [...tagIds]))

        const tagsById = new Map(tagRows.map((row) => [row.id, row]))
        for (const id of tagIds) {
          const row = tagsById.get(id)
          if (row === null || row === undefined) {
            return err({
              code: 'invalid-tag',
              field: 'tags',
              cause: { code: 'tag-not-found', tagId: id }
            })
          }
          if (row.userId !== actorId) {
            return err({
              code: 'invalid-tag',
              field: 'tags',
              cause: { code: 'tag-not-owned', tagId: id }
            })
          }
        }
      }

      try {
        await tx
          .update(bookmarkTable)
          .set({
            url,
            title,
            note,
            updatedAt: new Date()
          })
          .where(and(eq(bookmarkTable.id, bookmarkId), eq(bookmarkTable.userId, actorId)))

        await tx.delete(bookmarkTagsTable).where(eq(bookmarkTagsTable.bookmarkId, bookmarkId))

        if (tagIds.length > 0) {
          await tx.insert(bookmarkTagsTable).values(
            tagIds.map((tagId) => ({
              bookmarkId,
              tagId
            }))
          )

          await tx
            .update(tagsTable)
            .set({ lastUsedAt: new Date() })
            .where(and(eq(tagsTable.userId, actorId), inArray(tagsTable.id, [...tagIds])))
        }
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new DuplicateUrlConstraintError()
        }
        throw new UpdateBookmarkWriteError({ reason: error })
      }

      return ok({ bookmarkId })
    })
  } catch (error) {
    if (error instanceof DuplicateUrlConstraintError || isUniqueConstraintError(error)) {
      return err({ code: 'duplicate-url' })
    }
    return err({ code: 'unexpected-error' })
  }
}
