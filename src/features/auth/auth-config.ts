import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'

import { db } from '../../db'
import * as schema from '../../db/schema/auth-schema'

export const auth = betterAuth({
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
