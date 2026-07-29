import { createServerFn } from '@tanstack/react-start'
import { and, eq, ne, sql } from 'drizzle-orm'
import * as v from 'valibot'

import { getDB } from '../../../db/get-db.server'
import { tagsTable } from '../../../db/schema/tag'
import { requireRequestSession } from '../../auth/functions/request-session.server'
import { tagNameSchema } from '../lib/tag-name-schema'

const updateTagInputSchema = v.pipe(
  v.object({
    id: v.number(),
    name: v.optional(tagNameSchema),
    pinned: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
    color: v.optional(v.nullable(v.string()))
  }),
  v.check(
    (input) =>
      input.name !== undefined ||
      input.pinned !== undefined ||
      input.sortOrder !== undefined ||
      input.color !== undefined,
    'At least one of name, pinned, sortOrder, or color is required'
  )
)

export const updateTag = createServerFn({ method: 'POST' })
  .validator(updateTagInputSchema)
  .handler(async (ctx) => {
    const session = await requireRequestSession()
    const db = getDB()

    const { id, name, pinned, sortOrder, color } = ctx.data

    if (name !== undefined) {
      const [duplicate] = await db
        .select({ id: tagsTable.id })
        .from(tagsTable)
        .where(
          and(eq(tagsTable.name, name), eq(tagsTable.userId, session.user.id), ne(tagsTable.id, id))
        )
        .limit(1)

      if (duplicate != null) {
        throw new Error('Tag name already exists')
      }
    }

    const [updated] = await db
      .update(tagsTable)
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(pinned !== undefined ? { pinned } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
        ...(color !== undefined ? { color } : {}),
        updatedAt: sql`(cast(unixepoch('subsecond') * 1000 as integer))`
      })
      .where(and(eq(tagsTable.id, id), eq(tagsTable.userId, session.user.id)))
      .returning({ id: tagsTable.id })

    if (updated == null) {
      throw new Error('Tag not found')
    }

    return { id: updated.id }
  })
