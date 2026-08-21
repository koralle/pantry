import { useRouter } from '@tanstack/react-router'
import { Suspense, use } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { css } from 'styled-system/css'

import { createErrorFallback } from '../../../shared/components/error-fallback'
import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import type { ShelfTag } from '../../tags/lib/tag-shelf'
import type { BookmarkListItem } from '../lib/attach-bookmark-tags'
import type { ListLayout } from '../lib/list-layout-preference'
import { ListLoading } from './bookmark-list-loading'
import { BookmarkListResults } from './bookmark-list-results'
import { ListToolbar } from './bookmark-list-toolbar'

const ListError = createErrorFallback('一覧の読み込みに失敗しました')
const crossfade = css({ animationStyle: 'crossfade' })

export function BookmarkListFrame({
  search,
  layout,
  changeLayout,
  shelfTagsPromise,
  bookmarksPromise
}: {
  readonly search: BookmarkSearchSchema
  readonly layout: ListLayout
  readonly changeLayout: (layout: ListLayout) => void
  readonly shelfTagsPromise: Promise<ShelfTag[]>
  readonly bookmarksPromise: Promise<BookmarkListItem[]>
}) {
  const shelfTags = use(shelfTagsPromise)
  const router = useRouter()
  const listKey = [
    search.q ?? '',
    search.tags?.join(',') ?? '',
    search.tagMode,
    search.sort,
    String(search.limit)
  ].join('|')

  return (
    <>
      <ListToolbar
        search={search}
        layout={layout}
        onLayoutChange={changeLayout}
        shelfTags={shelfTags}
      />

      <ErrorBoundary
        FallbackComponent={ListError}
        onReset={() => {
          void router.invalidate()
        }}>
        <Suspense fallback={<ListLoading layout={layout} />}>
          <div
            key={listKey}
            className={crossfade}>
            <BookmarkListResults
              bookmarkPromise={bookmarksPromise}
              layout={layout}
              search={search}
              pageLimit={search.limit}
            />
          </div>
        </Suspense>
      </ErrorBoundary>
    </>
  )
}
