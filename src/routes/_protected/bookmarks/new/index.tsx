import { createFileRoute } from '@tanstack/react-router'
import * as v from 'valibot'

import { NewBookmarkScreen } from '../../../../features/bookmarks/components/new-bookmark-screen'

const bookmarkNewSearchSchema = v.object({
  tags: v.optional(v.array(v.string()))
})

export const Route = createFileRoute('/_protected/bookmarks/new/')({
  validateSearch: bookmarkNewSearchSchema,
  component: RouteComponent
})

function RouteComponent() {
  const search = Route.useSearch()
  return <NewBookmarkScreen searchTags={search.tags} />
}
