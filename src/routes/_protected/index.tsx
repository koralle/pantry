import {
  createFileRoute,
  ErrorComponent,
  ErrorComponentProps,
  getRouteApi
} from '@tanstack/react-router'
import { css } from 'styled-system/css'
import * as v from 'valibot'

import { ensureSession } from '../../features/auth/functions/ensure-session'
import { BookmarkList } from '../../features/bookmarks/components/bookmark-list'
import { fetchBookmarks } from '../../features/bookmarks/functions/fetch-bookmarks'
import { bookmarkSearchSchema } from '../../features/navigation/lib/bookmark-search'
import { bookmarkListLoaderDeps } from './-lib/bookmark-list-loader-deps'

const fadeUp = css({ animationStyle: 'fadeUp' })

const protectedRouteApi = getRouteApi('/_protected')

export const Route = createFileRoute('/_protected/')({
  validateSearch: (search) => v.parse(bookmarkSearchSchema, search),
  loaderDeps: ({ search }) => bookmarkListLoaderDeps(search),
  loader: async ({ deps }) => {
    const { user } = await ensureSession()

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

  return (
    <div className={fadeUp}>
      <BookmarkList
        search={search}
        bookmarksPromise={bookmarksPromise}
        shelfTagsPromise={shelfTagsPromise}
      />
    </div>
  )
}
