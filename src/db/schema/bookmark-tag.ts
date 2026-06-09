import { sqliteTable, integer, text, unique, index } from 'drizzle-orm/sqlite-core'

import { bookmarkTable } from './bookmark'
import { tagsTable } from './tag'

export const bookmarkTagsTable = sqliteTable(
  'bookmark_tags',
  {
    bookmarkId: text('bookmark_id')
      .notNull()
      .references(() => bookmarkTable.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tagsTable.id, { onDelete: 'cascade' })
  },
  (t) => [
    unique().on(t.bookmarkId, t.tagId),
    index('bookmark_tags_bookmark_id_idx').on(t.bookmarkId),
    index('bookmark_tags_tag_id_idx').on(t.tagId)
  ]
)
