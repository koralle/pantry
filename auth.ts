import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { passkey } from '@better-auth/passkey'
import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'
import { drizzle } from 'drizzle-orm/libsql'

import { env } from './env'
import * as schema from './src/db/schema/auth-schema'
import { passkeyPluginOptions } from './src/features/auth/lib/passkey.plugin-options'

// Drizzle-orm 1.0: SQLite drizzle() no longer accepts `schema` (use `relations` for RQBv2).
export const db = drizzle({
  connection: {
    authToken: env.TURSO_AUTH_TOKEN,
    url: env.TURSO_CONNECTION_URL
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
  session: {
    freshAge: 0
  },
  plugins: [admin(), passkey(passkeyPluginOptions(env.BETTER_AUTH_URL))]
})
