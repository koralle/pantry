import { drizzle } from 'drizzle-orm/libsql'

import { env } from '../../env'
import * as authTables from './schema/auth-schema'
import { bookmarkTable } from './schema/bookmark'
import { bookmarkTagsTable } from './schema/bookmark-tag'
import { tagsTable } from './schema/tag'

export const db = drizzle({
  connection: {
    url: env.DATABASE_URL
  },
  schema: {
    ...authTables,
    bookmark: bookmarkTable,
    bookmarkTags: bookmarkTagsTable,
    tags: tagsTable
  }
})
