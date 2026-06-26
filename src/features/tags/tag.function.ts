import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import * as v from 'valibot'

import { getDB } from '../../db/index.server'
import { tagsTable, tagInsertSchema } from '../../db/schema/tag'
import { offsetPaginationQuerySchema } from '../../schemas/pagination'
import { ensureSession } from '../auth/auth.function'

const addTagInputSchema = v.pick(tagInsertSchema, ['name'])

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
