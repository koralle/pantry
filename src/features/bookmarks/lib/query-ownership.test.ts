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

  test('一覧復帰のために staleTime Infinity と mutation 時の removeQueries を使う', () => {
    const helper = readSource('features/bookmarks/lib/bookmark-list-query-options.ts')
    expect(helper).toContain('Number.POSITIVE_INFINITY')
    expect(helper).not.toContain('refetchOnWindowFocus')
    expect(helper).not.toContain('refetchOnReconnect')
    expect(helper).not.toContain('refetchOnMount')
    expect(readSource('features/bookmarks/lib/reset-bookmark-list-cache.ts')).toContain(
      'removeQueries'
    )
  })

  test('query options 工場が BookmarkSearchSchema を受け、tags を tagNames へ写す', () => {
    const helper = readSource('features/bookmarks/lib/bookmark-list-query-options.ts')
    expect(helper).toContain('search: BookmarkSearchSchema')
    expect(helper).toContain('tagNames')
    expect(helper).not.toContain('BookmarkListQueryInput')
  })

  test('loader と hook は search を工場へそのまま渡す', () => {
    const hook = readSource('features/bookmarks/hooks/use-bookmark-list-pagination.ts')
    expect(hook).toContain('bookmarkListQueryOptions(search)')
    expect(hook).not.toContain('searchToQueryInput')
    expect(hook).not.toContain('tagNames')

    const index = readSource('routes/_protected/index.tsx')
    expect(index).toContain('loaderDeps: ({ search }) => search')
    expect(index).not.toContain('bookmarkListLoaderDeps')
  })

  test('一覧条件の React key は join 区切り文字列を使わない', () => {
    const frame = readSource('features/bookmarks/components/bookmark-list-frame.tsx')
    expect(frame).toContain('bookmarkListSearchIdentity')
    expect(frame).not.toContain("join(',')")
    expect(frame).not.toContain("join('|')")
  })

  test('scroll effect は searchRef ではなく開始時の search を閉じる', () => {
    const hook = readSource('features/bookmarks/hooks/use-bookmark-list-pagination.ts')
    expect(hook).not.toContain('searchRef')
    expect(hook).not.toContain('useRef')
    expect(hook).toContain('rememberBookmarkListScroll(search,')
    expect(hook).toContain('consumeBookmarkListScroll(search)')
  })

  test('BookmarkDetailSearch は schema から導出し listDefaults を持たない', () => {
    const search = readSource('features/navigation/lib/bookmark-search.ts')
    expect(search).toContain('export type BookmarkDetailSearch')
    expect(search).toContain('typeof bookmarkDetailSearchSchema')

    const builders = readSource('features/navigation/lib/bookmark-search-builders.ts')
    expect(builders).not.toContain('const listDefaults')
    expect(builders).not.toContain('export type BookmarkDetailSearch = {')
    expect(builders).toContain('defaultBookmarkSearch')
  })

  test('Card / Table 切替は query を捨てずスクロールだけ先頭へ戻す', () => {
    const source = readSource('features/bookmarks/components/bookmark-list.tsx')
    expect(source).toContain('window.scrollTo(0, 0)')
    expect(source).not.toContain('resetBookmarkListCache')
    expect(source).not.toContain('removeQueries')
  })
})
