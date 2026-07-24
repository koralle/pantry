import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Minimal Vite config for Storybook.
 * Intentionally excludes Cloudflare / TanStack Start app plugins.
 */
export default defineConfig({
  resolve: {
    alias: {
      'styled-system': path.resolve(dirname, '../../styled-system')
    }
  }
})
