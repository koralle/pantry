import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '../../..')

function readSource(relativePath: string): string {
  return readFileSync(join(srcDir, relativePath), 'utf8')
}

/**
 * 一覧 read の query key の所有者は bookmarkListQueryOptions だけ。
 * loader / component / load-more hook が同じ options 工場を使うことを source で固定する。
 */
describe('bookmark list query ownership', () => {
  const consumers = [
    'routes/_protected/index.tsx',
    'features/bookmarks/hooks/use-bookmark-list-pagination.ts',
    'features/bookmarks/components/bookmark-list-results.tsx'
  ]

  test('全 consumer が同じ options 工場を使う', () => {
    for (const path of consumers) {
      expect(readSource(path)).toContain('bookmarkListQueryOptions(')
    }
  })

  test('旧 Server Function と useInfiniteQuery は戻らない', () => {
    for (const path of consumers) {
      const source = readSource(path)
      expect(source).not.toContain('fetch-bookmarks')
      expect(source).not.toContain('fetchBookmarks')
      expect(source).not.toContain('useInfiniteQuery')
    }
  })

  test('load-more は offset 別の fetchQuery を使う', () => {
    const source = readSource(consumers[1] ?? '')
    expect(source).toContain('queryClient.fetchQuery')
    expect(source).toContain('offset: items.length')
  })

  test('options 工場だけが orpc.bookmarks.list を知る', () => {
    const helper = readSource('features/bookmarks/lib/bookmark-list-query-options.ts')
    expect(helper).toContain('orpc.bookmarks.list.queryOptions')

    for (const path of consumers) {
      expect(readSource(path)).not.toContain('orpc.bookmarks.list')
    }
  })
})
