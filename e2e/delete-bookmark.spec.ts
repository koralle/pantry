import type { Locator, Page } from '@playwright/test'

import { bookmarkId, createE2eDb, findE2eUserId, seedBookmark } from './db'
import { expect, test } from './fixtures'
import { readRuntime } from './runtime'

async function seedDoomedBookmark(): Promise<void> {
  const { libsqlUrl } = await readRuntime()
  const { db, close } = createE2eDb(libsqlUrl)
  try {
    const userId = await findE2eUserId(db)
    await seedBookmark(db, {
      id: bookmarkId(3),
      userId,
      title: 'Doomed',
      url: 'https://example.test/doomed'
    })
  } finally {
    close()
  }
}

async function openDialog(trigger: Locator, content: Locator): Promise<void> {
  await trigger.click()
  await expect(async () => {
    if (await content.isVisible()) {
      return
    }
    await trigger.click()
    await expect(content).toBeVisible()
  }).toPass()
}

async function deleteBookmark(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('link', { name: 'Doomed' }).click()
  const confirmButton = page.getByRole('button', { name: '削除を確認' })
  await openDialog(page.getByRole('button', { name: '削除' }), confirmButton)
  await confirmButton.click()
}

test('deleting a bookmark removes it from the list', async ({ page }) => {
  await seedDoomedBookmark()
  await deleteBookmark(page)
  await expect(page.getByRole('link', { name: 'Doomed' })).toHaveCount(0)
  await expect(page.getByText('まだブックマークがありません')).toBeVisible()
})
