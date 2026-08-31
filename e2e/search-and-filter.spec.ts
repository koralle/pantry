import { bookmarkId, createE2eDb, findE2eUserId, seedBookmarks, seedTag } from './db'
import { expect, test } from './fixtures'
import { readRuntime } from './runtime'

async function seedSearchBookmarks(): Promise<void> {
  const { libsqlUrl } = await readRuntime()
  const { db, close } = createE2eDb(libsqlUrl)
  try {
    const userId = await findE2eUserId(db)
    const rustTagId = await seedTag(db, { userId, name: 'rust' })
    const pythonTagId = await seedTag(db, { userId, name: 'python' })
    await seedBookmarks(db, [
      {
        id: bookmarkId(10),
        userId,
        title: 'Alpha rust',
        url: 'https://example.test/alpha',
        tagIds: [rustTagId]
      },
      {
        id: bookmarkId(11),
        userId,
        title: 'Beta python',
        url: 'https://example.test/beta',
        tagIds: [pythonTagId]
      },
      {
        id: bookmarkId(12),
        userId,
        title: 'Gamma both',
        url: 'https://example.test/gamma',
        tagIds: [rustTagId, pythonTagId]
      }
    ])
  } finally {
    close()
  }
}

test('search shows only bookmarks matching the query', async ({ page }) => {
  await seedSearchBookmarks()
  await page.goto('/')
  const searchField = page.getByPlaceholder('タイトル・URL・メモ')
  const searchButton = page.getByRole('button', { name: '検索' })
  await expect(async () => {
    await searchField.fill('Alpha')
    await searchButton.click()
    await expect(page).toHaveURL(/(?:\?|&)q=Alpha(?:&|$)/)
  }).toPass()

  await expect(page.getByRole('link', { name: 'Alpha rust' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Beta python' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Gamma both' })).toHaveCount(0)
})

test('tag filter shows only bookmarks assigned to the tag', async ({ page }) => {
  await seedSearchBookmarks()
  await page.goto('/')
  await page.getByRole('navigation', { name: 'タグ' }).getByRole('link', { name: /rust/ }).click()

  await expect(page.getByRole('link', { name: 'Alpha rust' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Gamma both' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Beta python' })).toHaveCount(0)
})
