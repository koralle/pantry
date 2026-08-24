import * as v from 'valibot'

import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
import type { UserId } from '../../auth/domain/auth-values'
import { tagIdSchema, tagNameSchema } from '../domain/tag-values'
import type { TagId, TagName } from '../domain/tag-values'

/**
 * HTTP 直前の形。id を含む更新入力をそのまま受ける。
 * 画面が送った pinned / color / sortOrder の省略と明示を、ここで確定させない。
 */
export const updateTagInputSchema = v.object({
  id: tagIdSchema,
  name: tagNameSchema,
  pinned: v.boolean(),
  sortOrder: v.number(),
  color: v.nullable(v.string())
})

export type UpdateTagWireInput = v.InferInput<typeof updateTagInputSchema>
export type UpdateTagValidatedInput = v.InferOutput<typeof updateTagInputSchema>

/**
 * Application が扱う確定済みコマンド。
 * id と正規化済みの name を含め、この層より内側では branded 値だけを扱う。
 */
export type UpdateTagCommand = {
  readonly id: TagId
  readonly name: TagName
  readonly pinned: boolean
  readonly sortOrder: number
  readonly color: string | null
}

export type UpdatedTag = {
  readonly id: TagId
}

/**
 * 呼び出し側が分岐できる失敗だけを Result に載せる。
 * 所有外・存在しないは `tag-not-found`、正規化名衝突は `tag-name-already-exists` に写す。
 * DB 障害のような想定外は throw のままにし、回復できないエラーで分岐を増やさない。
 */
export type UpdateTagError =
  | { readonly code: 'tag-name-already-exists' }
  | { readonly code: 'tag-not-found' }

export type UpdateTagInput = UpdateTagCommand & {
  readonly userId: UserId
}

/**
 * UpdateTag が永続化に求める能力だけ。汎用 TagRepository にしない。
 * `name-conflict` と `not-found` は推測ではなく、adapter が DB 結果として返す。
 */
export type UpdateTagOutput =
  | { readonly kind: 'updated'; readonly id: TagId }
  | { readonly kind: 'name-conflict' }
  | { readonly kind: 'not-found' }

/**
 * Application が知る永続化は、この関数型だけ。
 * Drizzle のクエリビルダを port に出すと、テストが fluent API の再現ゲームになる。
 */
export type UpdateTag = (input: UpdateTagInput) => Promise<UpdateTagOutput>

/**
 * Validation 済みの入力を、Application の branded コマンドへ写す。
 * procedure と Application で変換を二重に持たないための一点。
 */
export function toUpdateTagCommand(input: UpdateTagValidatedInput): UpdateTagCommand {
  return {
    id: input.id,
    name: input.name,
    pinned: input.pinned,
    sortOrder: input.sortOrder,
    color: input.color
  }
}

/**
 * Drizzle も HTTP も知らない。port の `name-conflict` / `not-found` を業務エラーへ写すだけにする。
 * 薄いのは意図で、Application テストから fluent API mock を消すための境界である。
 */
export async function executeUpdateTag(params: {
  readonly updateTag: UpdateTag
  readonly userId: UserId
  readonly command: UpdateTagCommand
}): Promise<Result<UpdatedTag, UpdateTagError>> {
  const output = await params.updateTag({
    userId: params.userId,
    ...params.command
  })

  if (output.kind === 'name-conflict') {
    return err({ code: 'tag-name-already-exists' })
  }

  if (output.kind === 'not-found') {
    return err({ code: 'tag-not-found' })
  }

  return ok({ id: output.id })
}
