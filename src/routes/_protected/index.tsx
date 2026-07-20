import { createFileRoute, ErrorComponent, ErrorComponentProps } from '@tanstack/react-router'
import * as v from 'valibot'

import { PantryMotion } from '../../components/pantry-motion'
import { ensureSession } from '../../features/auth/auth.function'
import { fetchBookmarks } from '../../features/bookmarks/bookmark.function'
import { BookmarkList } from '../../features/bookmarks/components/bookmark-list'
import { EntranceBoxes } from '../../features/tags/components/entrance-boxes'
import { bookmarkListLoaderDeps } from './-lib/bookmark-list-loader-deps'
import { bookmarkSearchSchema } from './-lib/bookmark-search-schema'

export const Route = createFileRoute('/_protected/')({
  validateSearch: (search) => v.parse(bookmarkSearchSchema, search),
  loaderDeps: ({ search }) => bookmarkListLoaderDeps(search),
  loader: async ({ deps }) => {
    const { user } = await ensureSession()

    if (deps.view === 'entrance') {
      return {
        user,
        bookmarksPromise: undefined
      }
    }

    const bookmarksPromise = fetchBookmarks({
      data: {
        tagMode: deps.tagMode,
        sort: deps.sort,
        limit: deps.limit,
        offset: deps.offset,
        ...(deps.q !== undefined ? { q: deps.q } : {}),
        ...(deps.tags !== undefined ? { tagNames: deps.tags } : {})
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
    return (
      <PantryMotion kind='fade-up'>
        <EntranceBoxes />
      </PantryMotion>
    )
  }

  return (
    <PantryMotion kind='fade-up'>
      <BookmarkList />
    </PantryMotion>
  )
}
