import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { buildNewBookmarkCommand } from '../../../../features/bookmarks/components/new-bookmark-command'

const dir = dirname(fileURLToPath(import.meta.url))
const routeSource = readFileSync(join(dir, 'index.tsx'), 'utf8')
const formSource = readFileSync(
  join(dir, '../../../../features/bookmarks/components/bookmark-workbench-form.tsx'),
  'utf8'
)
const hookSource = readFileSync(
  join(dir, '../../../../features/bookmarks/hooks/use-bookmark-title-fetch.ts'),
  'utf8'
)
const editRouteSource = readFileSync(join(dir, '../$id/edit.tsx'), 'utf8')

describe('buildNewBookmarkCommand', () => {
  test('新規ブックマークではタグを空配列で送る', () => {
    expect(
      buildNewBookmarkCommand({
        url: 'https://example.com/article',
        title: 'Example Article',
        note: 'メモ'
      })
    ).toStrictEqual({
      url: 'https://example.com/article',
      title: 'Example Article',
      note: 'メモ',
      tags: []
    })
  })
})

describe('new bookmark route', () => {
  test('CreateBookmark を oRPC mutationOptions 経由で送る', () => {
    expect(routeSource).toContain('orpc.bookmarks.create.mutationOptions')
    expect(routeSource).toContain('refreshAfterCreateBookmark')
  })

  test('旧 Server Function に依存しない', () => {
    expect(routeSource).not.toContain("from '../functions/add-bookmark'")
    expect(routeSource).not.toContain('addBookmark({')
  })

  test('Error の class 名と name に依存しない', () => {
    expect(routeSource).toContain('getCreateBookmarkErrorMessage')
    expect(routeSource).not.toContain('error.name')
    expect(formSource).not.toContain('instanceof Error')
    expect(formSource).not.toContain('error.message')
  })
})

describe('title fetch consumers', () => {
  test('workbench hook は bookmarks.title procedure を叩く', () => {
    expect(hookSource).toContain('bookmarks.title')
    expect(hookSource).not.toContain('fetchBookmarkTitle')
  })

  test('edit route の action は code 契約だけで文言を決める', () => {
    expect(editRouteSource).toContain('bookmarks.title')
    expect(editRouteSource).not.toContain('fetchBookmarkTitle')
    expect(editRouteSource).not.toContain('instanceof Error')
    expect(editRouteSource).not.toContain('error.message')
    expect(editRouteSource).toContain('getTitleFetchErrorMessage')
  })

  test('hook も Error message を直接表示しない', () => {
    expect(hookSource).not.toContain('instanceof Error')
    expect(hookSource).not.toContain('.message ===')
    expect(hookSource).toContain('getTitleFetchErrorMessage')
  })
})
