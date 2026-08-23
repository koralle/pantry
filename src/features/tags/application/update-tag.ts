import * as v from 'valibot'

import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
import type { UserId } from '../../auth/domain/auth-values'
import { tagIdSchema, tagNameSchema } from '../domain/tag-values'
import type { TagId, TagName } from '../domain/tag-values'

export const updateTagInputSchema = v.object({
  id: tagIdSchema,
  name: tagNameSchema,
  pinned: v.boolean(),
  sortOrder: v.number(),
  color: v.nullable(v.string())
})

export type UpdateTagWireInput = v.InferInput<typeof updateTagInputSchema>
export type UpdateTagValidatedInput = v.InferOutput<typeof updateTagInputSchema>

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

export type UpdateTagError =
  | { readonly code: 'tag-name-already-exists' }
  | { readonly code: 'tag-not-found' }

export type UpdateTagInput = UpdateTagCommand & {
  readonly userId: UserId
}

export type UpdateTagOutput =
  | { readonly kind: 'updated'; readonly id: TagId }
  | { readonly kind: 'name-conflict' }
  | { readonly kind: 'not-found' }

export type UpdateTag = (input: UpdateTagInput) => Promise<UpdateTagOutput>

export function toUpdateTagCommand(input: UpdateTagValidatedInput): UpdateTagCommand {
  return {
    id: input.id,
    name: input.name,
    pinned: input.pinned,
    sortOrder: input.sortOrder,
    color: input.color
  }
}

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
