import { createEnv } from '@t3-oss/env-core'

import { tursoCredentialValidators } from './src/db/turso-credentials'

export const databaseEnv = createEnv({
  runtimeEnv: process.env,
  server: tursoCredentialValidators
})
