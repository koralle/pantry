import { bookmarkId, createE2eDb, findE2eUserId, seedBookmark, seedTag } from './db'
import { expect, test } from './fixtures'
import { readRuntime } from './runtime'

test('editing a bookmark updates its tags', async ({ page }) => {
  const { libsqlUrl } = await readRuntime()
  const { db, close } = createE2eDb(libsqlUrl)
  try {
    const userId = await findE2eUserId(db)
    await seedTag(db, { userId, name: 'keep-tag' })
    const dropTagId = await seedTag(db, { userId, name: 'drop-tag' })
    await seedBookmark(db, {
      id: bookmarkId(2),
      userId,
      title: 'Editable',
      url: 'https://example.test/editable',
      tagIds: [dropTagId]
    })
  } finally {
    close()
  }

  await page.goto('/')
  await page.getByRole('link', { name: 'Editable' }).click()
  await page.getByRole('link', { name: '編集' }).click()
  await page.getByRole('button', { name: 'タグを選ぶ' }).click()
  await page.getByRole('option', { name: 'keep-tag' }).click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'drop-tagを外す' }).click()
  await page.getByLabel('タイトル').fill('Editable updated')
  await page.getByRole('button', { name: '更新' }).click()

  await expect(page.getByRole('heading', { name: 'Editable updated' })).toBeVisible()
  await expect(page.getByText('keep-tag', { exact: true })).toBeVisible()
  await expect(page.getByText('drop-tag', { exact: true })).toHaveCount(0)

  await page.getByRole('link', { name: '一覧へ戻る' }).click()
  const bookmarkLink = page.getByRole('link', { name: 'Editable updated' })
  await expect(bookmarkLink.getByText('keep-tag', { exact: true })).toBeVisible()
  await expect(page.getByText('drop-tag', { exact: true })).toHaveCount(0)
})
