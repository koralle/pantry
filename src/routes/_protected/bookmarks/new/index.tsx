import { createFileRoute } from '@tanstack/react-router'
import * as v from 'valibot'

import { NewBookmarkScreen } from '../../../../features/bookmarks/components/new-bookmark-screen'
import { fetchTags } from '../../../../features/tags/functions/fetch-tags'

const bookmarkNewSearchSchema = v.object({
  tags: v.optional(v.array(v.string()))
})

export const Route = createFileRoute('/_protected/bookmarks/new/')({
  validateSearch: bookmarkNewSearchSchema,
  loader: async () => {
    const tags = await fetchTags({ data: { limit: 1000, offset: 0 } })
    return { tags }
  },
  component: RouteComponent
})

function RouteComponent() {
  const { tags } = Route.useLoaderData()
  const search = Route.useSearch()
  return (
    <NewBookmarkScreen
      tags={tags}
      searchTags={search.tags}
    />
  )
}
