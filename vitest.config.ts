import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' }
    })
  ],
  // Required so Knip's Vitest plugin registers default test entry globs.
  test: {}
})
