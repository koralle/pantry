import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'

import { db } from './src/db'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite'
  })
})
