import { createServerOnlyFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/libsql'

import type { AppDb } from './app-db'
import { resolveTursoConnection } from './turso-connection'

function createDb(connection: { url: string; authToken: string }): AppDb {
  // Drizzle-orm 1.0: SQLite drizzle() no longer accepts `schema` (use `relations` for RQBv2).
  return drizzle({
    connection
  })
}

let cachedDb: AppDb | undefined

export const getDB = createServerOnlyFn((): AppDb => {
  if (cachedDb === undefined) {
    cachedDb = createDb(resolveTursoConnection(env))
  }
  return cachedDb
})
