import { createEnv } from '@t3-oss/env-core'
import * as v from 'valibot'

export const env = createEnv({
  runtimeEnv: process.env,
  server: {
    BETTER_AUTH_SECRET: v.pipe(v.string(), v.minLength(32)),
    BETTER_AUTH_URL: v.pipe(v.string(), v.url()),
    TURSO_AUTH_TOKEN: v.string(),
    TURSO_CONNECTION_URL: v.string()
  }
})
