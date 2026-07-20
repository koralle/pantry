import { createFileRoute, ErrorComponent, ErrorComponentProps } from '@tanstack/react-router'
import * as v from 'valibot'

import { ensureSession } from '../../features/auth/auth.function'
import { fetchBookmarks } from '../../features/bookmarks/bookmark.function'
import { BookmarkList } from '../../features/bookmarks/components/bookmark-list'
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

function RouteComponent() {
  const search = Route.useSearch()

  if (search.view === 'entrance') {
    return <EntranceBoxes />
  }

  return <BookmarkList />
}
