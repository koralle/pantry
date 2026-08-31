import { test as base } from '@playwright/test'

import { createE2eClient, resetApplicationTables } from './db'
import { readRuntime } from './runtime'

export const test = base.extend<{ resetData: void }>({
  resetData: [
    // oxlint-disable-next-line no-empty-pattern -- Playwright requires object destructuring here.
    async ({}, use) => {
      const { libsqlUrl } = await readRuntime()
      const { client, close } = createE2eClient(libsqlUrl)
      try {
        await resetApplicationTables(client)
        await use()
      } finally {
        close()
      }
    },
    { auto: true }
  ]
})

export { expect } from '@playwright/test'
