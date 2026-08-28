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
 * loader / load-more hook が同じ options 工場を使うことを source で固定する。
 */
describe('bookmark list query ownership', () => {
  const factoryConsumers = [
    'routes/_protected/index.tsx',
    'features/bookmarks/hooks/use-bookmark-list-pagination.ts'
  ]
  const uiConsumers = [
    ...factoryConsumers,
    'features/bookmarks/components/bookmark-list-results.tsx'
  ]

  test('全 consumer が同じ options 工場を使う', () => {
    for (const path of factoryConsumers) {
      expect(readSource(path)).toContain('bookmarkListQueryOptions(')
    }
  })

  test('旧 Server Function と offset fetchQuery は戻らない', () => {
    for (const path of uiConsumers) {
      const source = readSource(path)
      expect(source).not.toContain('fetch-bookmarks')
      expect(source).not.toContain('fetchBookmarks')
      expect(source).not.toContain('queryClient.fetchQuery')
      expect(source).not.toContain('offset: items.length')
    }
  })

  test('load-more は Infinite Query の次ページ取得を使う', () => {
    const source = readSource(factoryConsumers[1] ?? '')
    expect(source).toContain('useSuspenseInfiniteQuery')
    expect(source).toContain('fetchNextPage')
  })

  test('options 工場だけが orpc.bookmarks.list を知る', () => {
    const helper = readSource('features/bookmarks/lib/bookmark-list-query-options.ts')
    expect(helper).toContain('orpc.bookmarks.list.infiniteOptions')

    for (const path of uiConsumers) {
      expect(readSource(path)).not.toContain('orpc.bookmarks.list')
    }
  })

  test('一覧復帰のために staleTime Infinity と refetchOnMount false を使う', () => {
    const helper = readSource('features/bookmarks/lib/bookmark-list-query-options.ts')
    expect(helper).toContain('Number.POSITIVE_INFINITY')
    expect(helper).toContain('refetchOnMount: false')
    expect(readSource('features/bookmarks/lib/reset-bookmark-list-cache.ts')).toContain(
      'removeQueries'
    )
  })

  test('Card / Table 切替は query を捨てずスクロールだけ先頭へ戻す', () => {
    const source = readSource('features/bookmarks/components/bookmark-list.tsx')
    expect(source).toContain('window.scrollTo(0, 0)')
    expect(source).not.toContain('resetBookmarkListCache')
    expect(source).not.toContain('removeQueries')
  })
})
