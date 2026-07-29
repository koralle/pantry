import { createServerOnlyFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/libsql'

import { resolveTursoConnection } from './turso-connection'

type PantryDB = ReturnType<typeof createDb>

function createDb(connection: { url: string; authToken: string }) {
  // Drizzle-orm 1.0: SQLite drizzle() no longer accepts `schema` (use `relations` for RQBv2).
  return drizzle({
    connection
  })
}

let cachedDb: PantryDB | undefined

export const getDB = createServerOnlyFn(() => {
  if (cachedDb === undefined) {
    cachedDb = createDb(resolveTursoConnection(env))
  }
  return cachedDb
})
