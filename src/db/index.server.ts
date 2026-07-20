import { createServerOnlyFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/libsql'

import * as authTables from './schema/auth-schema'
import { bookmarkTable } from './schema/bookmark'
import { bookmarkTagsTable } from './schema/bookmark-tag'
import { tagsTable } from './schema/tag'
import { resolveTursoConnection } from './turso-connection'

const schema = {
  ...authTables,
  bookmark: bookmarkTable,
  bookmarkTags: bookmarkTagsTable,
  tags: tagsTable
}

type PantryDB = ReturnType<typeof createDb>

function createDb(connection: { url: string; authToken: string }) {
  return drizzle({
    connection,
    schema
  })
}

let cachedDb: PantryDB | undefined

export const getDB = createServerOnlyFn(() => {
  if (cachedDb === undefined) {
    cachedDb = createDb(resolveTursoConnection(env))
  }
  return cachedDb
})
