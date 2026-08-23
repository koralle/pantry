import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const featureDir = dirname(fileURLToPath(import.meta.url))

function readSource(relativePath: string): string {
  return readFileSync(join(featureDir, relativePath), 'utf8')
}

describe('UpdateBookmark oRPC migration source boundary', () => {
  test('edit route は update / load の Server Function を import しない', () => {
    const source = readSource('../../routes/_protected/bookmarks/$id/edit.tsx')
    expect(source).not.toContain("functions/update-bookmark'")
    expect(source).not.toContain('load-bookmark-for-edit')
    expect(source).toContain('orpc.bookmarks.update.mutationOptions')
    expect(source).toContain('orpc.bookmarks.editor.queryOptions')
    expect(source).not.toContain('error.name')
  })

  test('BookmarkEditor は旧 Application の port 型に依存しない', () => {
    const source = readSource('components/bookmark-editor/index.tsx')
    expect(source).not.toContain('application/execute-update-bookmark')
    expect(source).not.toContain('unexpected-error')
    expect(source).not.toContain('@orpc')
  })

  test('Application は Drizzle / AppDb / unexpected-error を import しない', () => {
    const source = readSource('application/update-bookmark.ts')
    expect(source).not.toContain('drizzle-orm')
    expect(source).not.toContain('AppDb')
    expect(source).not.toContain('unexpected-error')
    expect(source).not.toContain('@praha/error-factory')
  })

  test('Persistence adapter は UPDATE OR IGNORE を使い SQLite error を分類しない', () => {
    const source = readSource('persistence/update-bookmark.ts')
    expect(source).toContain('UPDATE OR IGNORE')
    expect(source).not.toContain('SQLITE_CONSTRAINT')
    expect(source).not.toContain('isSqliteUniqueConstraintError')
    expect(source).not.toContain('unexpected-error')
  })

  test('移行済みの Server Function と旧 Application ファイルは削除されている', () => {
    const removed = [
      'functions/update-bookmark.ts',
      'functions/update-bookmark.test.ts',
      'functions/load-bookmark-for-edit.ts',
      'application/execute-update-bookmark.ts',
      'application/execute-update-bookmark.test.ts',
      'application/load-bookmark-for-edit.ts',
      'application/load-bookmark-for-edit.test.ts'
    ]

    for (const relativePath of removed) {
      expect(existsSync(join(featureDir, relativePath)), relativePath).toBe(false)
    }
  })
})
