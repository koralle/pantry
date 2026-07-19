import { createServerOnlyFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/libsql'

import * as authTables from './schema/auth-schema'
import { bookmarkTable } from './schema/bookmark'
import { bookmarkTagsTable } from './schema/bookmark-tag'
import { tagsTable } from './schema/tag'
import { parseTursoCredentials } from './turso-credentials'

function createDB() {
  const credentials = parseTursoCredentials(env)

  return drizzle({
    connection: {
      url: credentials.TURSO_DATABASE_URL,
      authToken: credentials.TURSO_AUTH_TOKEN
    },
    schema: {
      ...authTables,
      bookmark: bookmarkTable,
      bookmarkTags: bookmarkTagsTable,
      tags: tagsTable
    }
  })
}

export const db = createDB()

export const getDB = createServerOnlyFn(createDB)
