import { and, eq } from 'drizzle-orm'
import * as v from 'valibot'

import type { AppDb } from '../../../db/app-db'
import { tagsTable } from '../../../db/schema/tag'
import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
import type { UserId } from '../../auth/domain/auth-values'
import { tagIdSchema, tagNameSchema } from '../domain/tag-values'
import type { TagId, TagName } from '../domain/tag-values'

export type SelectableTag = {
  readonly id: TagId
  readonly name: TagName
}

export type CreateTagError =
  | { readonly code: 'invalid-tag-name'; readonly field: 'name' }
  | { readonly code: 'duplicate-tag-name'; readonly field: 'name' }
  | { readonly code: 'unexpected-error' }

export type CreateTagResult = Result<SelectableTag, CreateTagError>

/** BookmarkEditor へ注入する createTag port の契約 */
export type CreateTag = (name: string) => Promise<CreateTagResult>

export type CreateTagParams = {
  readonly db: AppDb
  readonly actorId: UserId
  readonly name: string
}

function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }
  return (
    error.message.includes('UNIQUE constraint failed') ||
    error.message.includes('unique constraint')
  )
}

export async function createTag(params: CreateTagParams): Promise<CreateTagResult> {
  const parsedName = v.safeParse(tagNameSchema, params.name)
  if (!parsedName.success) {
    return err({ code: 'invalid-tag-name', field: 'name' })
  }

  const name = parsedName.output

  try {
    const [duplicate] = await params.db
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(and(eq(tagsTable.name, name), eq(tagsTable.userId, params.actorId)))
      .limit(1)

    if (duplicate != null) {
      return err({ code: 'duplicate-tag-name', field: 'name' })
    }

    const inserted = await params.db
      .insert(tagsTable)
      .values({
        name,
        userId: params.actorId
      })
      .returning({ id: tagsTable.id })

    const [first] = inserted
    if (first == null) {
      return err({ code: 'unexpected-error' })
    }

    const parsedId = v.safeParse(tagIdSchema, first.id)
    if (!parsedId.success) {
      return err({ code: 'unexpected-error' })
    }

    return ok({ id: parsedId.output, name })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return err({ code: 'duplicate-tag-name', field: 'name' })
    }

    console.error('createTag failed', error)
    return err({ code: 'unexpected-error' })
  }
}
