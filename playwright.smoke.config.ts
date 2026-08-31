import config from './playwright.config'

export default {
  ...config,
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'smoke',
      testMatch: /.*\.smoke\.spec\.ts/,
      dependencies: ['setup'],
      use: { storageState: 'e2e/.auth/user.json' }
    }
  ]
}
