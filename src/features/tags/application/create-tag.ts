import * as v from 'valibot'

import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
import type { UserId } from '../../auth/domain/auth-values'
import { tagNameSchema } from '../domain/tag-values'
import type { TagId, TagName } from '../domain/tag-values'

/**
 * HTTP 直前の形。省略項目はここでは default を埋めない。
 * 未送信と「明示的な false / 0 / null」を同じにすると、呼び出し側の意図が消える。
 */
export const createTagInputSchema = v.object({
  name: tagNameSchema,
  pinned: v.optional(v.boolean()),
  sortOrder: v.optional(v.number()),
  color: v.optional(v.nullable(v.string()))
})

export type CreateTagInput = v.InferOutput<typeof createTagInputSchema>

/**
 * Application が扱う確定済みコマンド。
 * DB default に任せずここで埋める。省略と明示値の区別は、この層より内側には持ち込まない。
 */
export type CreateTagCommand = {
  readonly name: TagName
  readonly pinned: boolean
  readonly sortOrder: number
  readonly color: string | null
}

export type CreatedTag = {
  readonly id: TagId
}

/**
 * 呼び出し側が分岐できる失敗だけを Result に載せる。
 * DB 障害のような想定外は throw のままにし、回復できないエラーで分岐を増やさない。
 */
export type CreateTagError = {
  readonly code: 'tag-name-already-exists'
}

export type InsertTagInput = {
  readonly userId: UserId
  readonly name: TagName
  readonly pinned: boolean
  readonly sortOrder: number
  readonly color: string | null
}

/**
 * CreateTag が永続化に求める能力だけ。汎用 TagRepository にしない。
 * `name-conflict` は制約違反の推測ではなく、adapter が衝突結果として返す。
 */
export type InsertTagOutput =
  | { readonly kind: 'created'; readonly id: TagId }
  | { readonly kind: 'name-conflict' }

/**
 * Application が知る永続化は、この関数型だけ。
 * Drizzle のクエリビルダを port に出すと、テストが fluent API の再現ゲームになる。
 */
export type InsertTag = (input: InsertTagInput) => Promise<InsertTagOutput>

/**
 * 省略された pinned / sortOrder / color を、現行テーブル default と同じ値へ確定する。
 * procedure と Application で default を二重に持たないための変換点。
 */
export function toCreateTagCommand(input: CreateTagInput): CreateTagCommand {
  return {
    name: input.name,
    pinned: input.pinned ?? false,
    sortOrder: input.sortOrder ?? 0,
    color: input.color ?? null
  }
}

/**
 * Drizzle も HTTP も知らない。port の衝突を業務エラーへ写すだけにする。
 * 薄いのは意図で、Application テストから fluent API mock を消すための境界である。
 */
export async function executeCreateTag(params: {
  readonly insertTag: InsertTag
  readonly userId: UserId
  readonly command: CreateTagCommand
}): Promise<Result<CreatedTag, CreateTagError>> {
  const output = await params.insertTag({
    userId: params.userId,
    name: params.command.name,
    pinned: params.command.pinned,
    sortOrder: params.command.sortOrder,
    color: params.command.color
  })

  if (output.kind === 'name-conflict') {
    return err({ code: 'tag-name-already-exists' })
  }

  return ok({ id: output.id })
}
