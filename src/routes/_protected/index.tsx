import {
  createFileRoute,
  ErrorComponent,
  ErrorComponentProps,
  getRouteApi
} from '@tanstack/react-router'
import * as v from 'valibot'

import { ensureSession } from '../../features/auth/functions/ensure-session'
import { BookmarkList } from '../../features/bookmarks/components/bookmark-list'
import { fetchBookmarks } from '../../features/bookmarks/functions/fetch-bookmarks'
import { bookmarkSearchSchema } from '../../features/navigation/lib/bookmark-search'
import { EntranceBoxes } from '../../features/tags/components/entrance-boxes'
import { PantryMotion } from '../../shared/components/pantry-motion'
import { bookmarkListLoaderDeps } from './-lib/bookmark-list-loader-deps'

const protectedRouteApi = getRouteApi('/_protected')

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
  const { bookmarksPromise } = Route.useLoaderData()
  const { shelfTagsPromise } = protectedRouteApi.useLoaderData()

  if (search.view === 'entrance') {
    return (
      <PantryMotion kind='fade-up'>
        <EntranceBoxes shelfTagsPromise={shelfTagsPromise} />
      </PantryMotion>
    )
  }

  return (
    <PantryMotion kind='fade-up'>
      <BookmarkList
        search={search}
        bookmarksPromise={bookmarksPromise}
        shelfTagsPromise={shelfTagsPromise}
      />
    </PantryMotion>
  )
}
