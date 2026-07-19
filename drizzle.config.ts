import { defineConfig } from 'drizzle-kit'

import { databaseEnv } from './database-env'

export default defineConfig({
  dbCredentials: {
    url: databaseEnv.TURSO_DATABASE_URL,
    authToken: databaseEnv.TURSO_AUTH_TOKEN
  },
  dialect: 'turso',
  out: './drizzle',
  schema: './src/db/schema'
})
