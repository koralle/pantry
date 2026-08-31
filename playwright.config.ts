import { defineConfig, devices } from '@playwright/test'

import { E2E_ORIGIN } from './e2e/constants'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter:
    process.env['GITHUB_ACTIONS'] === 'true' ? [['github'], ['html']] : [['list'], ['html']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: E2E_ORIGIN,
    viewport: { width: 1280, height: 720 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'pnpm exec tsx e2e/start-pantry.ts',
    url: E2E_ORIGIN,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
    gracefulShutdown: { signal: 'SIGTERM', timeout: 20_000 }
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'sign-in',
      testMatch: /sign-in\.spec\.ts/,
      dependencies: ['setup'],
      use: { storageState: { cookies: [], origins: [] } }
    },
    {
      name: 'main',
      testMatch: /.*\.spec\.ts/,
      testIgnore: [/sign-in\.spec\.ts/, /.*\.smoke\.spec\.ts/],
      dependencies: ['setup'],
      use: { storageState: 'e2e/.auth/user.json' }
    }
  ]
})
