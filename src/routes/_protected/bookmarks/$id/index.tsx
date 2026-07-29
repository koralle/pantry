import { createFileRoute } from '@tanstack/react-router'
import * as v from 'valibot'

import { BookmarkDetailScreen } from '../../../../features/bookmarks/components/bookmark-detail-screen'
import { loadBookmarkDetail } from '../../../../features/bookmarks/loaders/load-bookmark-detail'
import { buildListBackSearch } from '../../../../features/navigation/lib/bookmark-search-builders'

const bookmarkDetailSearchSchema = v.object({
  tags: v.optional(v.array(v.string()))
})

export const Route = createFileRoute('/_protected/bookmarks/$id/')({
  validateSearch: bookmarkDetailSearchSchema,
  loader: async ({ params }) => {
    const detailPromise = loadBookmarkDetail(params.id)
    return { detailPromise }
  },
  component: RouteComponent
})

function RouteComponent() {
  const { detailPromise } = Route.useLoaderData()
  const search = Route.useSearch()
  const listSearch = buildListBackSearch(search.tags)
  return (
    <BookmarkDetailScreen
      detailPromise={detailPromise}
      listSearch={listSearch}
    />
  )
}
