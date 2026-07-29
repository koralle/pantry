import path from 'node:path'

import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

const tanstackEntryStub = path.resolve(import.meta.dirname, 'vitest/tanstack-entry-stub.ts')

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' }
    })
  ],
  resolve: {
    alias: {
      '#tanstack-router-entry': tanstackEntryStub,
      '#tanstack-start-entry': tanstackEntryStub,
      '#tanstack-start-plugin-adapters': tanstackEntryStub
    }
  },
  // Required so Knip's Vitest plugin registers default test entry globs.
  test: {}
})
