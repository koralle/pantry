import type { Locator } from '@playwright/test'

import { expect } from './fixtures'
import { waitForReactReady } from './react-ready'

/**
 * ダイアログを一度の click で開く。
 * トリガーの click を toPass で再実行しない。初回 click が hydration に飲まれたら失敗する。
 */
export async function openDialog(trigger: Locator, content: Locator): Promise<void> {
  await waitForReactReady(trigger)
  await expect(trigger).toBeVisible()
  await expect(trigger).toBeEnabled()
  await trigger.click()
  await expect(content).toBeVisible()
}
