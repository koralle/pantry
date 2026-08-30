import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'persistence-integration',
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    globalSetup: ['./src/test/persistence/global-setup.ts'],
    reporters:
      process.env['GITHUB_ACTIONS'] === 'true' ? ['minimal', 'github-actions'] : ['minimal']
  }
})
