import { defineConfig } from 'drizzle-kit'

import { env } from './env'

export default defineConfig({
  dbCredentials: {
    authToken: env.TURSO_AUTH_TOKEN,
    url: env.TURSO_CONNECTION_URL
  },
  dialect: 'turso',
  out: './drizzle',
  schema: './src/db/schema'
})
