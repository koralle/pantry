import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import * as v from 'valibot'

import { getDB } from '../../../db/get-db.server'
import { tagsTable } from '../../../db/schema/tag'
import { requireRequestSession } from '../../auth/functions/request-session.server'
import { isSqliteUniqueConstraintError } from '../lib/is-sqlite-unique-constraint-error'
import { TagNameAlreadyExistsError } from '../lib/tag-name-already-exists-error'
import { tagNameSchema } from '../lib/tag-name-schema'

const addTagInputSchema = v.object({
  name: tagNameSchema,
  pinned: v.optional(v.boolean()),
  sortOrder: v.optional(v.number()),
  color: v.optional(v.nullable(v.string()))
})

export const addTag = createServerFn({ method: 'POST' })
  .validator(addTagInputSchema)
  .handler(async (ctx) => {
    const session = await requireRequestSession()
    const db = getDB()

    const { name, pinned, sortOrder, color } = ctx.data

    const [duplicate] = await db
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(
        and(eq(tagsTable.normalizedName, name.normalized), eq(tagsTable.userId, session.user.id))
      )
      .limit(1)

    if (duplicate != null) {
      throw new TagNameAlreadyExistsError()
    }

    try {
      const result = await db
        .insert(tagsTable)
        .values({
          name: name.display,
          normalizedName: name.normalized,
          userId: session.user.id,
          ...(pinned !== undefined ? { pinned } : {}),
          ...(sortOrder !== undefined ? { sortOrder } : {}),
          ...(color !== undefined ? { color } : {})
        })
        .returning({ id: tagsTable.id })

      const [first] = result

      if (first == null) {
        throw new Error('Failed to insert tag')
      }

      return { id: first.id }
    } catch (error) {
      if (isSqliteUniqueConstraintError(error)) {
        throw new TagNameAlreadyExistsError()
      }
      throw error
    }
  })
