import { createFileRoute, ErrorComponent, ErrorComponentProps, Link } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import * as v from 'valibot'

import { ErrorFallback } from '../../components/error-fallback'
import { UiLoading } from '../../components/ui-state'
import { ensureSession } from '../../features/auth/auth.function'
import { fetchBookmarks } from '../../features/bookmarks/bookmark.function'
import { BookmarkTable } from '../../features/bookmarks/components/bookmark-table'
import { EntranceBoxes } from '../../features/tags/components/entrance-boxes'
import { bookmarkSearchSchema } from './-lib/bookmark-search-schema'

export const Route = createFileRoute('/_protected/')({
  validateSearch: (search) => v.parse(bookmarkSearchSchema, search),
  loader: async ({ location }) => {
    const { user } = await ensureSession()
    const search = v.parse(bookmarkSearchSchema, location.search)

    if (search.view === 'entrance') {
      return {
        user,
        bookmarksPromise: undefined
      }
    }

    const bookmarksPromise = fetchBookmarks({
      data: {
        tagMode: search.tagMode,
        sort: search.sort,
        limit: search.limit,
        offset: search.offset,
        ...(search.q !== undefined ? { q: search.q } : {}),
        ...(search.tags !== undefined ? { tagNames: search.tags } : {})
      }
    })

    return {
      user,
      bookmarksPromise
    }
  },
  component: RouteComponent,
  errorComponent: BookmarkPageFallbackComponent
})

function BookmarkPageFallbackComponent({ error }: ErrorComponentProps) {
  return <ErrorComponent error={error} />
}

function ListPlaceholder() {
  const { user, bookmarksPromise } = Route.useLoaderData()

  if (bookmarksPromise === undefined) {
    return <UiLoading label='一覧を読み込み中' />
  }

  return (
    <>
      <h1>{user.name}のブックマーク一覧</h1>

      <Link to='/bookmarks/new'>新規作成</Link>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<UiLoading label='一覧を読み込み中' />}>
          <BookmarkTable bookmarkPromise={bookmarksPromise} />
        </Suspense>
      </ErrorBoundary>
    </>
  )
}

function RouteComponent() {
  const search = Route.useSearch()

  if (search.view === 'entrance') {
    return <EntranceBoxes />
  }

  return <ListPlaceholder />
}
