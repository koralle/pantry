import * as v from 'valibot'

import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
import type { UserId } from '../../auth/domain/auth-values'
import type { TagId } from '../domain/tag-values'
import { tagIdSchema } from '../domain/tag-values'

/**
 * HTTP 直前の形。id は wire では plain number で、ここで TagId へ確定する。
 */
export const touchTagInputSchema = v.object({ id: tagIdSchema })

export type TouchTagError = {
  readonly code: 'tag-not-found'
}

export type TouchTagInput = {
  readonly userId: UserId
  readonly id: TagId
}

/**
 * TouchTag が永続化に求める能力だけ。汎用 TagRepository にしない。
 * adapter は actor の tag だけを update し、returning の有無を結果として返す。
 */
export type TouchTagOutput = { readonly kind: 'touched' } | { readonly kind: 'not-found' }

export type TouchTag = (input: TouchTagInput) => Promise<TouchTagOutput>

/**
 * Drizzle も HTTP も知らない。port の not-found を業務エラーへ写すだけにする。
 * 薄いのは意図で、Application テストから fluent API mock を消すための境界である。
 */
export async function executeTouchTag(params: {
  readonly touchTag: TouchTag
  readonly userId: UserId
  readonly id: TagId
}): Promise<Result<void, TouchTagError>> {
  const output = await params.touchTag({
    userId: params.userId,
    id: params.id
  })

  if (output.kind === 'not-found') {
    return err({ code: 'tag-not-found' })
  }

  return ok(undefined)
}
