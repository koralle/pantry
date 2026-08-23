import { and, eq, sql } from 'drizzle-orm'
import * as v from 'valibot'

import type { AppDb } from '../../../db/app-db'
import { tagsTable } from '../../../db/schema/tag'
import type { UpdateTagInput, UpdateTagOutput } from '../application/update-tag'
import { tagIdSchema } from '../domain/tag-values'

export async function updateTag(db: AppDb, input: UpdateTagInput): Promise<UpdateTagOutput> {
  const persist = (): Promise<UpdateTagOutput> =>
    db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: tagsTable.id })
        .from(tagsTable)
        .where(and(eq(tagsTable.id, input.id), eq(tagsTable.userId, input.userId)))
        .limit(1)

      if (existing === undefined) {
        return { kind: 'not-found' }
      }

      const [updated] = await tx.all<{ id: number }>(sql`
        UPDATE OR IGNORE tags
        SET name = ${input.name.display},
            normalized_name = ${input.name.normalized},
            pinned = ${input.pinned ? 1 : 0},
            sort_order = ${input.sortOrder},
            color = ${input.color},
            updated_at = (cast(unixepoch('subsecond') * 1000 as integer))
        WHERE id = ${input.id} AND user_id = ${input.userId}
        RETURNING id
      `)

      if (updated === undefined) {
        return { kind: 'name-conflict' }
      }

      return { kind: 'updated', id: v.parse(tagIdSchema, updated.id) }
    })

  const persistWithRetry = async (attempt: number): Promise<UpdateTagOutput> => {
    try {
      return await persist()
    } catch (error) {
      if (
        error === null ||
        typeof error !== 'object' ||
        !('code' in error) ||
        error.code !== 'SQLITE_LOCKED' ||
        attempt === 4
      ) {
        throw error
      }

      // Ponytail: 75 ms retry window; increase only if observed contention outlasts it.
      // eslint-disable-next-line promise/avoid-new -- Web timers do not expose a Promise API.
      await new Promise<void>((resolve) => setTimeout(resolve, 5 * 2 ** attempt))
      return persistWithRetry(attempt + 1)
    }
  }

  return persistWithRetry(0)
}
