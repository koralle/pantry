import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { StorybookConfig } from '@storybook/tanstack-react'
import viteReact from '@vitejs/plugin-react'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * App vite.config.ts pulls in Cloudflare Workers + TanStack Start plugins that
 * break Storybook's Vite runner. Use a dedicated config for Storybook instead.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: '@storybook/tanstack-react',
  core: {
    builder: {
      name: '@storybook/builder-vite',
      options: {
        // Avoid loading the app vite.config (cloudflare / tanstackStart).
        viteConfigPath: path.resolve(dirname, 'vite.config.ts')
      }
    }
  },
  async viteFinal(viteConfig) {
    const { mergeConfig } = await import('vite')

    viteConfig.build ??= {}
    // Vite 8 / Rolldown: preserve Storybook global module execution order.
    ;(viteConfig.build as { rolldownOptions?: Record<string, unknown> }).rolldownOptions ??= {}
    const { rolldownOptions } = viteConfig.build as {
      rolldownOptions: Record<string, unknown>
    }
    rolldownOptions.experimental = {
      ...(rolldownOptions.experimental as object | undefined),
      strictExecutionOrder: true
    }

    return mergeConfig(viteConfig, {
      plugins: [viteReact()],
      resolve: {
        alias: {
          'styled-system': path.resolve(dirname, '../styled-system')
        }
      }
    })
  }
}

export default config
