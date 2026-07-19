import { createEnv } from '@t3-oss/env-core'
import * as v from 'valibot'

export const databaseEnv = createEnv({
  runtimeEnv: process.env,
  server: {
    TURSO_DATABASE_URL: v.pipe(v.string(), v.url()),
    TURSO_AUTH_TOKEN: v.string()
  }
})
