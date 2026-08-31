import { bookmarkId, createE2eDb, findE2eUserId, seedBookmark } from './db'
import { expect, test } from './fixtures'
import { readRuntime } from './runtime'

test.describe.serial('fixture の独立性', () => {
  test('先のテストが入れたブックマークは後続へ漏れない', async ({ page }) => {
    const { libsqlUrl } = await readRuntime()
    const { db, close } = createE2eDb(libsqlUrl)
    try {
      const userId = await findE2eUserId(db)
      await seedBookmark(db, {
        id: bookmarkId(1),
        userId,
        title: 'LeakProbe',
        url: 'https://example.test/leak-probe'
      })
    } finally {
      close()
    }
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'LeakProbe' })).toBeVisible()
  })

  test('後続テストは空のブックマーク表から始まる', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('まだブックマークがありません')).toBeVisible()
    await expect(page.getByRole('link', { name: 'LeakProbe' })).toHaveCount(0)
  })
})
