import { createEnv } from '@t3-oss/env-core'
import * as v from 'valibot'

export const env = createEnv({
  runtimeEnv: process.env,
  server: {
    TURSO_AUTH_TOKEN: v.string(),
    TURSO_CONNECTION_URL: v.string()
  }
})
