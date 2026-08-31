import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { expect, test as setup } from '@playwright/test'

import { ensureE2eUser } from './auth-user'
import { E2E_USER } from './constants'
import { createE2eClient, resetAllDataTables } from './db'
import { readRuntime } from './runtime'

const authFile = path.join(import.meta.dirname, '.auth/user.json')

setup('認証済み状態を保存する', async ({ page }) => {
  const { libsqlUrl } = await readRuntime()
  const { client, close } = createE2eClient(libsqlUrl)
  try {
    await resetAllDataTables(client)
  } finally {
    close()
  }
  await ensureE2eUser(libsqlUrl)
  await page.goto('/sign-in')
  await page.getByRole('textbox', { name: 'メール' }).fill(E2E_USER.email)
  await page.getByRole('textbox', { name: 'パスワード' }).fill(E2E_USER.password)
  await page.getByRole('button', { name: 'サインイン' }).click()
  await expect(page.getByRole('link', { name: '新規' }).first()).toBeVisible()
  await mkdir(path.dirname(authFile), { recursive: true })
  await page.context().storageState({ path: authFile })
})
