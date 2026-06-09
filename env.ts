import { createEnv } from '@t3-oss/env-core'
import * as v from 'valibot'

export const env = createEnv({
  runtimeEnv: process.env,
  server: {
    DATABASE_URL: v.string()
  }
})
