import { createEnv } from '@t3-oss/env-core'
import * as v from 'valibot'

export const env = createEnv({
  runtimeEnv: process.env,
  server: {
    CLOUDFLARE_ACCOUNT_ID: v.string(),
    CLOUDFLARE_D1_TOKEN: v.string(),
    CLOUDFLARE_DATABASE_ID: v.string()
  }
})
