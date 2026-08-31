import { expect, test } from './fixtures'

test('ブックマークを作成すると一覧から確認できる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: '新規' }).first().click()
  await page.getByLabel('URL').fill('https://example.test/created')
  await page.getByLabel('タイトル').fill('Created from E2E')
  await page.getByRole('button', { name: '登録' }).click()
  await expect(page.getByRole('heading', { name: 'Created from E2E' })).toBeVisible()
  await page.getByRole('link', { name: '一覧へ戻る' }).click()
  await expect(page.getByRole('link', { name: 'Created from E2E' })).toBeVisible()
})
