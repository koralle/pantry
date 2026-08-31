import { expect, test } from './fixtures'

test('https://example.com のタイトル取得結果がフォームに反映される', async ({ page }) => {
  await page.goto('/bookmarks/new')
  await page.getByLabel('URL').fill('https://example.com')
  await page.getByRole('button', { name: 'タイトルを取得' }).click()
  await expect(page.getByLabel('タイトル')).toHaveValue(/example/i)
})
