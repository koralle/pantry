import { sql } from 'drizzle-orm'
import { sqliteTable, integer, text, unique, index } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/valibot'

import { user } from './auth-schema'

export const bookmarkTable = sqliteTable(
  'bookmarks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    url: text().notNull(),
    title: text().notNull(),
    note: text(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' })
  },
  (t) => [
    unique().on(t.userId, t.url),
    index('bookmarks_user_id_created_at_idx').on(t.userId, t.createdAt),
    index('bookmarks_user_id_updated_at_idx').on(t.userId, t.updatedAt)
  ]
)

export type BookmarkSelectType = typeof bookmarkTable.$inferSelect

export const bookmarkSelectSchema = createSelectSchema(bookmarkTable)
export const bookmarkInsertSchema = createInsertSchema(bookmarkTable)
