import { createServerFn } from '@tanstack/react-start'
import { and, eq, ne, sql } from 'drizzle-orm'
import * as v from 'valibot'

import { getDB } from '../../db/index.server'
import { tagsTable } from '../../db/schema/tag'
import { offsetPaginationQuerySchema } from '../../schemas/pagination'
import { ensureSession } from '../auth/auth.function'
import { tagNameSchema } from './tag-name.schema'

const addTagInputSchema = v.object({
  name: tagNameSchema
})

const tagIdSchema = v.object({
  id: v.number()
})

const updateTagInputSchema = v.object({
  id: v.number(),
  name: tagNameSchema
})

export const fetchTags = createServerFn({ method: 'GET' })
  .validator(offsetPaginationQuerySchema)
  .handler(async (ctx) => {
    const session = await ensureSession()

    const { limit, offset } = ctx.data

    const db = getDB()

    return db
      .select()
      .from(tagsTable)
      .where(eq(tagsTable.userId, session.user.id))
      .limit(limit)
      .offset(offset)
  })

export const addTag = createServerFn({ method: 'POST' })
  .validator(addTagInputSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const { name } = ctx.data

    const result = await db
      .insert(tagsTable)
      .values({ name, userId: session.user.id })
      .returning({ id: tagsTable.id })

    const [first] = result

    if (first == null) {
      throw new Error('Failed to insert tag')
    }

    return { id: first.id }
  })

export const getTag = createServerFn({ method: 'GET' })
  .validator(tagIdSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const [tag] = await db
      .select()
      .from(tagsTable)
      .where(and(eq(tagsTable.id, ctx.data.id), eq(tagsTable.userId, session.user.id)))
      .limit(1)

    if (tag == null) {
      throw new Error('Tag not found')
    }

    return tag
  })

export const updateTag = createServerFn({ method: 'POST' })
  .validator(updateTagInputSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const { id, name } = ctx.data

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

    const [updated] = await db
      .update(tagsTable)
      .set({
        name,
        updatedAt: sql`(cast(unixepoch('subsecond') * 1000 as integer))`
      })
      .where(and(eq(tagsTable.id, id), eq(tagsTable.userId, session.user.id)))
      .returning({ id: tagsTable.id })

    if (updated == null) {
      throw new Error('Tag not found')
    }

    return { id: updated.id }
  })
