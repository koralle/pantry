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
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    version: integer({ mode: 'number' }).notNull().default(1)
  },
  (t) => [unique().on(t.userId, t.name), index('user_id_idx').on(t.userId)]
)

export type TagSelectType = typeof tagsTable.$inferSelect

export const tagSelectSchema = createSelectSchema(tagsTable)
export const tagInsertSchema = createInsertSchema(tagsTable)
