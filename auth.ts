import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'
import { drizzle } from 'drizzle-orm/libsql'

import { env } from './env'
import * as schema from './src/db/schema/auth-schema'
import { bookmarkTable } from './src/db/schema/bookmark'
import { bookmarkTagsTable } from './src/db/schema/bookmark-tag'
import { tagsTable } from './src/db/schema/tag'

export const db = drizzle({
  connection: {
    authToken: env.TURSO_AUTH_TOKEN,
    url: env.TURSO_CONNECTION_URL
  },
  schema: {
    ...schema,
    bookmark: bookmarkTable,
    bookmarkTags: bookmarkTagsTable,
    tags: tagsTable
  }
})

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      ...schema
    }
  }),
  emailAndPassword: {
    enabled: true
  },
  plugins: [admin()]
})
