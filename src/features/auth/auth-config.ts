import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'
import { env } from 'cloudflare:workers'

import { db } from '../../db/index.server'
import * as schema from '../../db/schema/auth-schema'

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
