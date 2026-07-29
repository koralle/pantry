import { useRouter } from '@tanstack/react-router'
import { Suspense, use } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { css } from 'styled-system/css'

import { PantryMotion } from '../../../shared/components/pantry-motion'
import { UiError, UiLoading } from '../../../shared/components/ui-state'
import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import { useTouchTagLastUsedOnce } from '../../tags/hooks/use-touch-tag-last-used'
import type { ShelfTag } from '../../tags/lib/tag-shelf'
import { useListLayout } from '../hooks/use-list-layout'
import type { BookmarkListItem } from '../lib/attach-bookmark-tags'
import type { ListLayout } from '../lib/list-layout-preference'
import { bookmarkCards } from './bookmark-card-list'
import { BookmarkListResults } from './bookmark-list-results'
import { ListToolbar } from './bookmark-list-toolbar'

const tableSkeleton = css({ display: 'flex', flexDirection: 'column', gap: '2' })

function ListError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <UiError
      message={getErrorMessage(error) ?? '一覧の読み込みに失敗しました'}
      onRetry={resetErrorBoundary}
    />
  )
}

function ListLoading({ layout }: { readonly layout: ListLayout }) {
  if (layout === 'card') {
    return (
      <div
        className={bookmarkCards}
        aria-busy='true'>
        <UiLoading label='一覧を読み込み中' />
        <UiLoading label='一覧を読み込み中' />
        <UiLoading label='一覧を読み込み中' />
      </div>
    )
  }

  return (
    <div
      className={tableSkeleton}
      aria-busy='true'>
      <UiLoading label='一覧を読み込み中' />
      <UiLoading label='一覧を読み込み中' />
      <UiLoading label='一覧を読み込み中' />
    </div>
  )
}

function BookmarkListFrame({
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
          <PantryMotion
            key={listKey}
            kind='crossfade'>
            <BookmarkListResults
              bookmarkPromise={bookmarksPromise}
              layout={layout}
              search={search}
              pageLimit={search.limit}
            />
          </PantryMotion>
        </Suspense>
      </ErrorBoundary>
    </>
  )
}

type BookmarkListProps = {
  readonly search: BookmarkSearchSchema
  readonly bookmarksPromise: Promise<BookmarkListItem[]> | undefined
  readonly shelfTagsPromise: Promise<ShelfTag[]>
}

export function BookmarkList({ search, bookmarksPromise, shelfTagsPromise }: BookmarkListProps) {
  const [layout, changeLayout] = useListLayout()

  useTouchTagLastUsedOnce(search, shelfTagsPromise)

  if (bookmarksPromise === undefined) {
    return <UiLoading label='一覧を読み込み中' />
  }

  return (
    <section aria-label='ブックマーク一覧'>
      <Suspense
        fallback={
          <>
            <ListToolbar
              search={search}
              layout={layout}
              onLayoutChange={changeLayout}
              shelfTags={[]}
            />
            <ListLoading layout={layout} />
          </>
        }>
        <BookmarkListFrame
          search={search}
          layout={layout}
          changeLayout={changeLayout}
          shelfTagsPromise={shelfTagsPromise}
          bookmarksPromise={bookmarksPromise}
        />
      </Suspense>
    </section>
  )
}
