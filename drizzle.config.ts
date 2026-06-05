import { defineConfig } from 'drizzle-kit'

import { env } from './env'

export default defineConfig({
  dialect: 'turso',
  out: './drizzle',
  schema: './src/db/schema',
  dbCredentials: {
    url: env.DATABASE_URL
  }
})
