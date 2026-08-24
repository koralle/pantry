import { createFileRoute } from '@tanstack/react-router'
import * as v from 'valibot'

import { BookmarkDetailScreen } from '../../../../features/bookmarks/components/bookmark-detail-screen'
import { bookmarkDetailQueryOptions } from '../../../../features/bookmarks/lib/bookmark-detail-query-options'
import { buildListBackSearch } from '../../../../features/navigation/lib/bookmark-search-builders'

const bookmarkDetailSearchSchema = v.object({
  tags: v.optional(v.array(v.string()))
})

export const Route = createFileRoute('/_protected/bookmarks/$id/')({
  validateSearch: bookmarkDetailSearchSchema,
  loader: async ({ params, context }) => {
    // Screen の useSuspenseQuery と同じ query options を先に温める。
    void context.queryClient.prefetchQuery(bookmarkDetailQueryOptions(params.id))

    return {}
  },
  component: RouteComponent
})

function RouteComponent() {
  const { id } = Route.useParams()
  const search = Route.useSearch()
  const listSearch = buildListBackSearch(search.tags)
  return (
    <BookmarkDetailScreen
      id={id}
      listSearch={listSearch}
    />
  )
}
