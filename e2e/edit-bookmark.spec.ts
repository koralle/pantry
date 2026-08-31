import type { Locator, Page } from '@playwright/test'

import { bookmarkId, createE2eDb, findE2eUserId, seedBookmark, seedTag } from './db'
import { expect, test } from './fixtures'
import { PASS_EXPECT_TIMEOUT_MS, passOptions } from './pass'
import { readRuntime } from './runtime'

async function seedEditableBookmark(): Promise<void> {
  const { libsqlUrl } = await readRuntime()
  const { db, close } = createE2eDb(libsqlUrl)
  try {
    const userId = await findE2eUserId(db)
    await seedTag(db, { userId, name: 'keep-tag' })
    const dropTagId = await seedTag(db, { userId, name: 'drop-tag' })
    await seedBookmark(db, {
      id: bookmarkId(2),
      userId,
      title: 'Editable',
      url: 'https://example.test/editable',
      tagIds: [dropTagId]
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
    await expect(content).toBeVisible({ timeout: PASS_EXPECT_TIMEOUT_MS })
  }).toPass(passOptions)
}

async function updateBookmarkTags(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('link', { name: 'Editable' }).click()
  await page.getByRole('link', { name: '編集' }).click()
  await openDialog(
    page.getByRole('button', { name: 'タグを選ぶ' }),
    page.getByRole('option', { name: 'keep-tag' })
  )
  await page.getByRole('option', { name: 'keep-tag' }).click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'drop-tagを外す' }).click()
  await page.getByLabel('タイトル').fill('Editable updated')
  await page.getByRole('button', { name: '更新' }).click()
}

async function expectUpdatedDetail(page: Page): Promise<void> {
  const detail = page.getByRole('region', { name: 'ブックマーク詳細' })
  await expect(detail.getByRole('heading', { name: 'Editable updated' })).toBeVisible()
  await expect(detail.getByText('keep-tag', { exact: true })).toBeVisible()
  await expect(detail.getByText('drop-tag', { exact: true })).toHaveCount(0)
}

async function expectUpdatedList(page: Page): Promise<void> {
  await page.getByRole('link', { name: '一覧へ戻る' }).click()
  const bookmarkRow = page.getByRole('row', { name: 'Editable updated' })
  await expect(bookmarkRow.getByText('keep-tag', { exact: true })).toBeVisible()
  await expect(bookmarkRow.getByText('drop-tag', { exact: true })).toHaveCount(0)
}

test('editing a bookmark updates its tags', async ({ page }) => {
  await seedEditableBookmark()
  await updateBookmarkTags(page)
  await expectUpdatedDetail(page)
  await expectUpdatedList(page)
})
