import { createFileRoute } from '@tanstack/react-router'
import * as v from 'valibot'

import { EditBookmarkScreen } from '../../../../features/bookmarks/components/edit-bookmark-screen'
import { loadBookmarkEditor } from '../../../../features/bookmarks/loaders/load-bookmark-editor'

const bookmarkEditSearchSchema = v.object({
  tags: v.optional(v.array(v.string()))
})

export const Route = createFileRoute('/_protected/bookmarks/$id/edit')({
  validateSearch: bookmarkEditSearchSchema,
  loader: async ({ params }) => loadBookmarkEditor(params.id),
  component: RouteComponent
})

function RouteComponent() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  return (
    <EditBookmarkScreen
      data={data}
      searchTags={search.tags}
    />
  )
}
