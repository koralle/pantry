import { createServerOnlyFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/libsql'

import * as authTables from './schema/auth-schema'
import { bookmarkTable } from './schema/bookmark'
import { bookmarkTagsTable } from './schema/bookmark-tag'
import { tagsTable } from './schema/tag'

export const db = drizzle({
  connection: {
    authToken: env.TURSO_AUTH_TOKEN,
    url: env.TURSO_CONNECTION_URL
  },
  schema: {
    ...authTables,
    bookmark: bookmarkTable,
    bookmarkTags: bookmarkTagsTable,
    tags: tagsTable
  }
})

export const getDB = createServerOnlyFn(() =>
  drizzle({
    connection: {
      authToken: env.TURSO_AUTH_TOKEN,
      url: env.TURSO_CONNECTION_URL
    },
    schema: {
      ...authTables,
      bookmark: bookmarkTable,
      bookmarkTags: bookmarkTagsTable,
      tags: tagsTable
    }
  })
)
