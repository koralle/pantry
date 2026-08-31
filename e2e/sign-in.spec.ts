import { expect, test } from '@playwright/test'

test('sign-in page renders the login heading', async ({ page }) => {
  await page.goto('/sign-in')
  await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
})
