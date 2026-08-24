import * as v from 'valibot'

import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
import type { UserId } from '../../auth/domain/auth-values'
import { tagIdSchema } from '../../tags/domain/tag-values'
import type { TagId } from '../../tags/domain/tag-values'
import {
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
export const createBookmarkInputSchema = v.object({
  url: bookmarkUrlSchema,
  title: bookmarkTitleSchema,
  note: bookmarkNoteSchema,
  tags: v.array(tagIdSchema)
})

/**
 * Procedure の validation 済み入力が、そのまま Application へ渡る確定コマンドになる。
 * 省略と明示値の区別は schema 層で消えるため、変換点は置かない。
 */
export type CreateBookmarkCommand = v.InferOutput<typeof createBookmarkInputSchema>

export type CreatedBookmark = {
  readonly id: BookmarkId
}

/**
 * 呼び出し側が分岐できる失敗だけを Result に載せる。
 * transaction 内の未知障害は rollback のために throw のまま通す。
 */
export type CreateBookmarkError =
  | { readonly code: 'duplicate-url' }
  | { readonly code: 'invalid-tag' }

export type InsertBookmarkInput = {
  readonly userId: UserId
  readonly url: BookmarkUrl
  readonly title: BookmarkTitle
  readonly note: BookmarkNote
  readonly tagIds: readonly TagId[]
}

/**
 * CreateBookmark が永続化に求める能力だけ。transaction 境界も adapter の内部詳細。
 * `duplicate-url` / `invalid-tag` は制約や SQLite error の推測ではなく、
 * adapter が検証した結果として返す。
 */
export type InsertBookmarkOutput =
  | { readonly kind: 'created'; readonly id: BookmarkId }
  | { readonly kind: 'duplicate-url' }
  | { readonly kind: 'invalid-tag' }

export type InsertBookmark = (input: InsertBookmarkInput) => Promise<InsertBookmarkOutput>

export async function executeCreateBookmark(params: {
  readonly insertBookmark: InsertBookmark
  readonly userId: UserId
  readonly command: CreateBookmarkCommand
}): Promise<Result<CreatedBookmark, CreateBookmarkError>> {
  const output = await params.insertBookmark({
    userId: params.userId,
    url: params.command.url,
    title: params.command.title,
    note: params.command.note,
    tagIds: params.command.tags
  })

  if (output.kind === 'duplicate-url') {
    return err({ code: 'duplicate-url' })
  }
  if (output.kind === 'invalid-tag') {
    return err({ code: 'invalid-tag' })
  }

  return ok({ id: output.id })
}
