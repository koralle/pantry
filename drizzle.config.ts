import { defineConfig } from 'drizzle-kit'

import { env } from './env'

export default defineConfig({
  dbCredentials: {
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN
  },
  dialect: 'turso',
  out: './drizzle',
  schema: './src/db/schema'
})
