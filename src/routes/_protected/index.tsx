import {
  createFileRoute,
  ErrorComponent,
  ErrorComponentProps,
  getRouteApi
} from '@tanstack/react-router'
import * as v from 'valibot'

import { BookmarkList } from '../../features/bookmarks/components/bookmark-list'
import { fetchBookmarks } from '../../features/bookmarks/functions/fetch-bookmarks'
import { bookmarkSearchSchema } from '../../features/navigation/lib/bookmark-search'
import { PantryMotion } from '../../shared/components/pantry-motion'
import { bookmarkListLoaderDeps } from './-lib/bookmark-list-loader-deps'

const protectedRouteApi = getRouteApi('/_protected')

export const Route = createFileRoute('/_protected/')({
  validateSearch: (search) => v.parse(bookmarkSearchSchema, search),
  loaderDeps: ({ search }) => bookmarkListLoaderDeps(search),
  loader: async ({ deps }) => {
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
