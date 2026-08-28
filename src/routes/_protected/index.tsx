import {
  createFileRoute,
  ErrorComponent,
  ErrorComponentProps,
  getRouteApi
} from '@tanstack/react-router'
import { css } from 'styled-system/css'
import * as v from 'valibot'

import { BookmarkList } from '../../features/bookmarks/components/bookmark-list'
import { bookmarkListQueryOptions } from '../../features/bookmarks/lib/bookmark-list-query-options'
import { bookmarkSearchSchema } from '../../features/navigation/lib/bookmark-search'
import { bookmarkListLoaderDeps } from './-lib/bookmark-list-loader-deps'

const fadeUp = css({ animationStyle: 'fadeUp' })

const protectedRouteApi = getRouteApi('/_protected')

export const Route = createFileRoute('/_protected/')({
  validateSearch: (search) => v.parse(bookmarkSearchSchema, search),
  loaderDeps: ({ search }) => bookmarkListLoaderDeps(search),
  loader: async ({ deps, context }) => {
    // Component が同じ query options を読む。待たずに流すことで streaming を維持する。
    void context.queryClient.prefetchQuery(bookmarkListQueryOptions(deps))

    return {}
  },
  component: RouteComponent,
  errorComponent: BookmarkPageFallbackComponent
})

function BookmarkPageFallbackComponent({ error }: ErrorComponentProps) {
  return <ErrorComponent error={error} />
}

function RouteComponent() {
  const search = Route.useSearch()
  const { shelfTagsPromise } = protectedRouteApi.useLoaderData()

  return (
    <div className={fadeUp}>
      <BookmarkList
        search={search}
        shelfTagsPromise={shelfTagsPromise}
      />
    </div>
  )
}
