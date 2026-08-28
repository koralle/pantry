import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))

describe('BookmarkDeleteDialog', () => {
  const source = readFileSync(join(dir, 'bookmark-delete-dialog.tsx'), 'utf8')

  test('Error の class 名と message 文字列に依存しない', () => {
    expect(source).not.toContain('error.name')
    expect(source).not.toContain("'Bookmark not found'")
    expect(source).toContain('getDeleteBookmarkErrorMessage')
  })

  test('oRPC mutation 経路を使う', () => {
    expect(source).toContain('mutationOptions')
    expect(source).toContain('mutateAsync')
    expect(source).not.toContain('../functions/delete-bookmark')
  })

  test('削除成功後は共通の一覧 refresh を使う', () => {
    expect(source).toContain("refreshAfterBookmarkMutation(router, queryClient, 'DeleteBookmark')")
    expect(source).not.toContain('resetBookmarkListCache')
  })
})
