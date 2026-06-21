import { createFileRoute, ErrorComponent, ErrorComponentProps } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import * as v from 'valibot'

import { ErrorFallback } from '../../components/error-fallback'
import { ensureSession } from '../../features/auth/auth.function'
import { fetchBookmarks } from '../../features/bookmarks/bookmark.function'
import { BookmarkTable } from '../../features/bookmarks/components/bookmark-table'
import { offsetPaginationQuerySchema } from '../../schemas/pagination'
import { bookmarkSearchSchema } from './-lib/bookmark-search-schema'

export const Route = createFileRoute('/_protected/')({
  validateSearch: (search) => v.parse(bookmarkSearchSchema, search),
  loader: async ({ location }) => {
    const { user } = await ensureSession()
    const search = v.parse(bookmarksSearchSchema, location.search)

    const bookmarksPromise = fetchBookmarks({
      data: { limit: search.limit, offset: search.offset }
    })

    return {
      user,
      bookmarksPromise
    }
  },
  component: RouteComponent,
  errorComponent: BookmarkPageFallbackComponent
})

const bookmarksSearchSchema = v.object({
  ...offsetPaginationQuerySchema.entries
})

function BookmarkPageFallbackComponent({ error }: ErrorComponentProps) {
  return <ErrorComponent error={error} />
}

function RouteComponent() {
  const { user, bookmarksPromise } = Route.useLoaderData()

  return (
    <>
      <h1>{user.name}のブックマーク一覧</h1>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<p>Loading...</p>}>
          <BookmarkTable bookmarkPromise={bookmarksPromise} />
        </Suspense>
      </ErrorBoundary>
    </>
  )
}
