import { bookmarkId, createE2eDb, findE2eUserId, seedBookmark } from './db'
import { expect, test } from './fixtures'
import { readRuntime } from './runtime'

test('deleting a bookmark removes it from the list', async ({ page }) => {
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

  await page.goto('/')
  await page.getByRole('link', { name: 'Doomed' }).click()
  await page.getByRole('button', { name: '削除' }).click()
  await page.getByRole('button', { name: '削除を確認' }).click()

  await expect(page.getByRole('link', { name: 'Doomed' })).toHaveCount(0)
  await expect(page.getByText('まだブックマークがありません')).toBeVisible()
})
