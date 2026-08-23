import path from 'node:path'

import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

const tanstackEntryStub = path.resolve(import.meta.dirname, 'vitest/tanstack-entry-stub.ts')
const aliases = {
  '#tanstack-router-entry': tanstackEntryStub,
  '#tanstack-start-entry': tanstackEntryStub,
  '#tanstack-start-plugin-adapters': tanstackEntryStub
} as const
/**
 * Libsql の `:memory:` は workerd で動かない。
 * 画面テストはソースを読むだけだが、workers の exclude を足すと Vitest 既定 exclude が消え、
 * `node_modules` まで拾うので、ここへまとめて Node project へ逃がす。
 */
const nodeTests = [
  'src/features/tags/persistence/**/*.test.ts',
  'src/features/bookmarks/persistence/**/*.test.ts',
  'src/features/tags/components/new-tag-screen.test.ts',
  'src/features/tags/components/inline-add-tag.test.ts',
  'src/features/tags/components/edit-tag-screen.test.ts',
  'src/features/tags/components/edit-tag-form.test.ts',
  'src/features/tags/hooks/use-touch-tag-last-used.test.ts',
  'src/rpc/source-boundary.test.ts',
  'src/features/bookmarks/components/new-bookmark-screen.test.ts',
  'src/features/bookmarks/orpc-update.source.test.ts',
  'src/features/bookmarks/components/bookmark-delete-dialog.test.ts',
  'src/features/bookmarks/lib/query-ownership.test.ts'
]

export default defineConfig({
  resolve: {
    alias: aliases
  },
  // Required so Knip's Vitest plugin registers default test entry globs.
  test: {
    projects: [
      {
        plugins: [
          cloudflareTest({
            wrangler: { configPath: './wrangler.jsonc' }
          })
        ],
        resolve: {
          alias: aliases
        },
        test: {
          name: 'workers',
          include: ['src/**/*.{test,spec}.ts'],
          exclude: nodeTests
        }
      },
      {
        resolve: {
          alias: aliases
        },
        test: {
          name: 'node',
          environment: 'node',
          include: nodeTests
        }
      }
    ]
  }
})
