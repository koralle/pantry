import { defineConfig } from 'drizzle-kit'

import { env } from './env'

export default defineConfig({
  dbCredentials: {
    url: env.DATABASE_URL
  },
  dialect: 'turso',
  out: './drizzle',
  schema: './src/db/schema'
})
