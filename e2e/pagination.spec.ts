import type { Page } from '@playwright/test'

import { BOOKMARK_LIST_PAGE_SIZE } from '../src/features/bookmarks/lib/bookmark-list-page-size'
import { bookmarkId, createE2eDb, findE2eUserId, seedBookmarks } from './db'
import { expect, test } from './fixtures'
import { PASS_EXPECT_TIMEOUT_MS, passOptions } from './pass'
import { readRuntime } from './runtime'

async function seedPaginatedBookmarks(): Promise<void> {
  const { libsqlUrl } = await readRuntime()
  const { db, close } = createE2eDb(libsqlUrl)
  try {
    const userId = await findE2eUserId(db)
    const base = new Date('2026-01-01T00:00:00.000Z').getTime()
    const firstPage = Array.from({ length: BOOKMARK_LIST_PAGE_SIZE }, (_, index) => ({
      id: bookmarkId(100 + index),
      userId,
      title: `Keep ${String(index).padStart(2, '0')}`,
      url: `https://example.test/keep-${index}`,
      createdAt: new Date(base + (BOOKMARK_LIST_PAGE_SIZE + 1 - index) * 1000)
    }))
    await seedBookmarks(db, [
      ...firstPage,
      {
        id: bookmarkId(100 + BOOKMARK_LIST_PAGE_SIZE),
        userId,
        title: 'Next Page Alpha',
        url: 'https://example.test/next-alpha',
        createdAt: new Date(base + 1000)
      },
      {
        id: bookmarkId(101 + BOOKMARK_LIST_PAGE_SIZE),
        userId,
        title: 'Next Page Beta',
        url: 'https://example.test/next-beta',
        createdAt: new Date(base)
      }
    ])
  } finally {
    close()
  }
}

async function loadNextPage(page: Page): Promise<void> {
  const loadMoreButton = page.getByRole('button', { name: 'さらに読み込む' })
  const nextPageAlpha = page.getByRole('link', { name: 'Next Page Alpha' })
  await expect(loadMoreButton).toBeVisible()
  await expect(async () => {
    await loadMoreButton.click()
    await expect(nextPageAlpha).toBeVisible({ timeout: PASS_EXPECT_TIMEOUT_MS })
  }).toPass(passOptions)
}

test('cursor pagination で次ページを読むと既存項目を残したまま追加される', async ({ page }) => {
  await seedPaginatedBookmarks()
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Keep 00' })).toBeVisible()
  const nextPageAlpha = page.getByRole('link', { name: 'Next Page Alpha' })
  await expect(nextPageAlpha).toHaveCount(0)

  await loadNextPage(page)

  await expect(page.getByRole('link', { name: 'Keep 00' })).toBeVisible()
  await expect(nextPageAlpha).toBeVisible()
  await expect(page.getByRole('link', { name: 'Next Page Beta' })).toBeVisible()
})
