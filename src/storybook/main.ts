import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { StorybookConfig } from '@storybook/tanstack-react'
import viteReact from '@vitejs/plugin-react'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  stories: ['../**/*.stories.@(js|jsx|mjs|ts|tsx)'],
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

    return mergeConfig(viteConfig, {
      plugins: [viteReact()],
      resolve: {
        alias: {
          'styled-system': path.resolve(dirname, '../../styled-system')
        }
      }
    })
  }
}

export default config
