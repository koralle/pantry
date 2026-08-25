import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { buildNewBookmarkCommand } from '../../../../features/bookmarks/components/new-bookmark-command'

const dir = dirname(fileURLToPath(import.meta.url))
const routeSource = readFileSync(join(dir, 'index.tsx'), 'utf8')
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
  test('BookmarkForm を使う', () => {
    expect(routeSource).toContain(
      "from '../../../../features/bookmarks/components/bookmark-editor/bookmark-form'"
    )
    expect(routeSource).toContain('<BookmarkForm')
    expect(routeSource).not.toContain('BookmarkWorkbenchForm')
    expect(routeSource).not.toContain('bookmark-workbench-form')
  })

  test('新規作成ラベルと空の初期値を渡す', () => {
    expect(routeSource).toContain("submitLabel='登録'")
    expect(routeSource).toContain("pendingLabel='登録中…'")
    expect(routeSource).toContain("legend='ブックマーク新規登録'")
    expect(routeSource).toContain("url: ''")
    expect(routeSource).toContain("title: ''")
    expect(routeSource).toContain('note: null')
  })

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
    expect(routeSource).not.toContain('instanceof Error')
    expect(routeSource).not.toContain('error.message')
  })

  test('UNAUTHORIZED はフォームエラーにしない', () => {
    expect(routeSource).toContain('if (message !== null)')
  })

  test('保存成功後の遷移失敗は保存失敗と混ぜない', () => {
    expect(routeSource).toContain('保存は完了しましたが、画面の移動に失敗しました')
  })
})

describe('title fetch consumers', () => {
  test('new route の action は code 契約だけで文言を決める', () => {
    expect(routeSource).toContain('bookmarks.title')
    expect(routeSource).not.toContain('fetchBookmarkTitle')
    expect(routeSource).not.toContain('instanceof Error')
    expect(routeSource).not.toContain('error.message')
    expect(routeSource).toContain('getTitleFetchErrorMessage')
  })

  test('edit route の action は code 契約だけで文言を決める', () => {
    expect(editRouteSource).toContain('bookmarks.title')
    expect(editRouteSource).not.toContain('fetchBookmarkTitle')
    expect(editRouteSource).not.toContain('instanceof Error')
    expect(editRouteSource).not.toContain('error.message')
    expect(editRouteSource).toContain('getTitleFetchErrorMessage')
  })
})

describe('removed workbench form', () => {
  test('BookmarkWorkbenchForm は削除されている', () => {
    expect(
      existsSync(join(dir, '../../../../features/bookmarks/components/bookmark-workbench-form.tsx'))
    ).toBe(false)
  })

  test('旧 title fetch hook は削除されている', () => {
    expect(
      existsSync(join(dir, '../../../../features/bookmarks/hooks/use-bookmark-title-fetch.ts'))
    ).toBe(false)
  })
})
