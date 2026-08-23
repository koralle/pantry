import path from 'node:path'

import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

const tanstackEntryStub = path.resolve(import.meta.dirname, 'vitest/tanstack-entry-stub.ts'),

 aliases = {
  '#tanstack-router-entry': tanstackEntryStub,
  '#tanstack-start-entry': tanstackEntryStub,
  '#tanstack-start-plugin-adapters': tanstackEntryStub
} as const

/**
 * 既定の `pnpm test` には載せない。warmup と 50 サンプルが Turso 相当の DB を書き換えるため。
 */
export default defineConfig({
  resolve: {
    alias: aliases
  },
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' }
    })
  ],
  test: {
    name: 'bench',
    include: ['scripts/bench-create-tag.worker.ts'],
    testTimeout: 120_000
  }
})
