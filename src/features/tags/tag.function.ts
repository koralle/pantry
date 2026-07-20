import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull, ne, sql } from 'drizzle-orm'
import * as v from 'valibot'

import { getDB } from '../../db/index.server'
import { bookmarkTable } from '../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../db/schema/bookmark-tag'
import { tagsTable } from '../../db/schema/tag'
import { offsetPaginationQuerySchema } from '../../schemas/pagination'
import { ensureSession } from '../auth/auth.function'
import { TagNameAlreadyExistsError } from './tag-errors'
import { tagNameSchema } from './tag-name.schema'
import type { ShelfTag } from './tag-shelf'

const addTagInputSchema = v.object({
  name: tagNameSchema,
  pinned: v.optional(v.boolean()),
  sortOrder: v.optional(v.number()),
  color: v.optional(v.nullable(v.string()))
})

const tagIdSchema = v.object({
  id: v.number()
})

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

export const fetchShelfTags = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ShelfTag[]> => {
    const session = await ensureSession()
    const db = getDB()

    const rows = await db
      .select({
        id: tagsTable.id,
        name: tagsTable.name,
        pinned: tagsTable.pinned,
        sortOrder: tagsTable.sortOrder,
        color: tagsTable.color,
        lastUsedAt: tagsTable.lastUsedAt,
        bookmarkCount: sql<number>`count(${bookmarkTable.id})`.mapWith(Number)
      })
      .from(tagsTable)
      .leftJoin(bookmarkTagsTable, eq(bookmarkTagsTable.tagId, tagsTable.id))
      .leftJoin(
        bookmarkTable,
        and(eq(bookmarkTable.id, bookmarkTagsTable.bookmarkId), isNull(bookmarkTable.deletedAt))
      )
      .where(eq(tagsTable.userId, session.user.id))
      .groupBy(tagsTable.id)

    return rows
  }
)

export const addTag = createServerFn({ method: 'POST' })
  .validator(addTagInputSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const { name, pinned, sortOrder, color } = ctx.data

    const [duplicate] = await db
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(and(eq(tagsTable.name, name), eq(tagsTable.userId, session.user.id)))
      .limit(1)

    if (duplicate != null) {
      throw new TagNameAlreadyExistsError()
    }

    const result = await db
      .insert(tagsTable)
      .values({
        name,
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

export const touchTagLastUsed = createServerFn({ method: 'POST' })
  .validator(tagIdSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const [updated] = await db
      .update(tagsTable)
      .set({
        lastUsedAt: new Date()
      })
      .where(and(eq(tagsTable.id, ctx.data.id), eq(tagsTable.userId, session.user.id)))
      .returning({ id: tagsTable.id })

    if (updated == null) {
      throw new Error('Tag not found')
    }

    return { ok: true as const }
  })

export const updateTag = createServerFn({ method: 'POST' })
  .validator(updateTagInputSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
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
