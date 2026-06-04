import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'

import * as authTables from './schema/auth-schema'
import { bookmarkTable } from './schema/bookmark'
import { bookmarkTagsTable } from './schema/bookmark-tag'
import { tagsTable } from './schema/tag'

export const db = drizzle(env.DB, {
  schema: {
    ...authTables,
    bookmark: bookmarkTable,
    bookmarkTags: bookmarkTagsTable,
    tags: tagsTable
  }
})
