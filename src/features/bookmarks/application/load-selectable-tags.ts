import { asc, eq } from 'drizzle-orm'
import * as v from 'valibot'

import type { AppDb } from '../../../db/app-db'
import { tagsTable } from '../../../db/schema/tag'
import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
import type { UserId } from '../../auth/domain/auth-values'
import { tagIdSchema, tagNameSchema } from '../../tags/domain/tag-values'
import type { TagId, TagName } from '../../tags/domain/tag-values'

export type SelectableTag = {
  readonly id: TagId
  readonly name: TagName
}

export type LoadSelectableTagsError = { readonly code: 'unexpected-error' }

export type SelectableTagsResult = Result<readonly SelectableTag[], LoadSelectableTagsError>

/** UI / Server Function 注入用。db と actorId は境界側で束縛済み。 */
export type LoadSelectableTags = () => Promise<SelectableTagsResult>

export function recoverSelectableTagsPromise(
  promise: Promise<SelectableTagsResult>
): Promise<SelectableTagsResult> {
  return promise.catch(() => err({ code: 'unexpected-error' }))
}

export async function loadSelectableTags(params: {
  readonly db: AppDb
  readonly actorId: UserId
}): Promise<SelectableTagsResult> {
  const { db, actorId } = params

  try {
    const rows = await db
      .select({
        id: tagsTable.id,
        name: tagsTable.name
      })
      .from(tagsTable)
      .where(eq(tagsTable.userId, actorId))
      .orderBy(asc(tagsTable.name))

    const tags: SelectableTag[] = []
    for (const row of rows) {
      const parsedId = v.safeParse(tagIdSchema, row.id)
      const parsedName = v.safeParse(tagNameSchema, row.name)
      if (!parsedId.success || !parsedName.success) {
        return err({ code: 'unexpected-error' })
      }
      tags.push({ id: parsedId.output, name: parsedName.output })
    }

    return ok(tags)
  } catch {
    return err({ code: 'unexpected-error' })
  }
}
