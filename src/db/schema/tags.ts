import { sql } from 'drizzle-orm'
import { sqliteTable } from 'drizzle-orm/sqlite-core'

export const tagsTable = sqliteTable('tags', (t) => ({
  createdAt: t
    .text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  id: t.integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: t.text().notNull().unique(),
  updatedAt: t
    .text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  version: t.integer({ mode: 'number' }).notNull().default(1)
}))

export type Tag = typeof tagsTable.$inferSelect
