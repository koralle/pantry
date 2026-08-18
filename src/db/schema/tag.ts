import { sql } from 'drizzle-orm'
import { sqliteTable, integer, text, unique, index } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/valibot'

import { user } from './auth-schema'

export const tagsTable = sqliteTable(
  'tags',
  {
    id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    userId: text('user_id')
      .references(() => user.id, {
        onUpdate: 'no action',
        onDelete: 'cascade'
      })
      .notNull(),
    name: text().notNull(),
    normalizedName: text('normalized_name').notNull(),
    pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order', { mode: 'number' }).notNull().default(0),
    color: text('color'),
    lastUsedAt: integer('last_used_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    version: integer({ mode: 'number' }).notNull().default(1)
  },
  (t) => [
    unique().on(t.userId, t.normalizedName),
    index('user_id_idx').on(t.userId),
    index('tags_user_id_pinned_sort_order_idx').on(t.userId, t.pinned, t.sortOrder),
    index('tags_user_id_last_used_at_idx').on(t.userId, t.lastUsedAt)
  ]
)

export const tagSelectSchema = createSelectSchema(tagsTable)
export const tagInsertSchema = createInsertSchema(tagsTable)
