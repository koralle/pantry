import { defineConfig } from 'drizzle-kit'

import { env } from './env'

export default defineConfig({
  out: './drizzle',
  dialect: 'sqlite',
  schema: './src/db/schema',
  driver: 'd1-http',
  dbCredentials: {
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    databaseId: env.CLOUDFLARE_DATABASE_ID,
    token: env.CLOUDFLARE_D1_TOKEN
  }
})
