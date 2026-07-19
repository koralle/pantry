import { createEnv } from '@t3-oss/env-core'
import * as v from 'valibot'

export const env = createEnv({
  runtimeEnv: process.env,
  server: {
    TURSO_DATABASE_URL: v.string(),
    TURSO_AUTH_TOKEN: v.string(),
    BETTER_AUTH_SECRET: v.string(),
    BETTER_AUTH_URL: v.string()
  }
})
