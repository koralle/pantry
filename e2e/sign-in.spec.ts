import { expect, test } from '@playwright/test'

import { E2E_USER } from './constants'

test('email and password sign-in shows the bookmark list', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByRole('textbox', { name: 'メール' }).fill(E2E_USER.email)
  await page.getByRole('textbox', { name: 'パスワード' }).fill(E2E_USER.password)
  await page.getByRole('button', { name: 'サインイン' }).click()
  await expect(page).toHaveURL(/\/(\?.*)?$/)
  await expect(page.getByRole('link', { name: '新規' }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'ログイン' })).toHaveCount(0)
  await expect(page.getByText('まだブックマークがありません')).toBeVisible()
})
