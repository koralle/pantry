import * as v from 'valibot'

import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
import type { UserId } from '../../auth/domain/auth-values'
import { tagIdSchema } from '../../tags/domain/tag-values'
import type { TagId } from '../../tags/domain/tag-values'
import { assertUniqueTagIds } from '../domain/bookmark'
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

/**
 * HTTP 直前の形。domain schema が URL protocol・非空 title・note 正規化を担うため、
 * Application 側で二重に検証しない。
 */
export const updateBookmarkInputSchema = v.object({
  id: bookmarkIdSchema,
  url: bookmarkUrlSchema,
  title: bookmarkTitleSchema,
  note: bookmarkNoteSchema,
  tags: v.array(tagIdSchema)
})

/**
 * Procedure の validation 済み入力が、そのまま Application へ渡る確定コマンドになる。
 */
export type UpdateBookmarkCommand = v.InferOutput<typeof updateBookmarkInputSchema>

export type UpdatedBookmark = {
  readonly id: BookmarkId
}

/**
 * 呼び出し側が分岐できる失敗だけを Result に載せる。
 * 重複 tag ID は domain rule、tag の存在と所有は adapter の検証結果として invalid-tag に統一する。
 * transaction 内の未知障害は rollback のために throw のまま通す。
 */
export type UpdateBookmarkError =
  | { readonly code: 'bookmark-not-found' }
  | { readonly code: 'duplicate-url' }
  | { readonly code: 'invalid-tag' }

export type UpdateBookmarkInput = {
  readonly userId: UserId
  readonly bookmarkId: BookmarkId
  readonly url: BookmarkUrl
  readonly title: BookmarkTitle
  readonly note: BookmarkNote
  readonly tagIds: readonly TagId[]
}

/**
 * UpdateBookmark が永続化に求める能力だけ。transaction 境界も adapter の内部詳細。
 * `bookmark-not-found` / `duplicate-url` / `invalid-tag` は SQLite error や事前 SELECT の
 * 推測ではなく、adapter が検証した結果として返す。
 */
export type UpdateBookmarkOutput =
  | { readonly kind: 'updated'; readonly id: BookmarkId }
  | { readonly kind: 'bookmark-not-found' }
  | { readonly kind: 'duplicate-url' }
  | { readonly kind: 'invalid-tag' }

export type UpdateBookmark = (input: UpdateBookmarkInput) => Promise<UpdateBookmarkOutput>

export async function executeUpdateBookmark(params: {
  readonly updateBookmark: UpdateBookmark
  readonly userId: UserId
  readonly command: UpdateBookmarkCommand
}): Promise<Result<UpdatedBookmark, UpdateBookmarkError>> {
  const uniqueTagIds = assertUniqueTagIds(params.command.tags)
  if (!uniqueTagIds.ok) {
    return err({ code: 'invalid-tag' })
  }

  const output = await params.updateBookmark({
    userId: params.userId,
    bookmarkId: params.command.id,
    url: params.command.url,
    title: params.command.title,
    note: params.command.note,
    tagIds: uniqueTagIds.value
  })

  if (output.kind === 'updated') {
    return ok({ id: output.id })
  }

  return err({ code: output.kind })
}
