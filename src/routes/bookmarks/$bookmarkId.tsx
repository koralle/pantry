import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { api } from '../../lib/api'

function BookmarkDetailPage() {
  const { bookmarkId } = Route.useParams()
  const { data, isLoading } = useQuery({
    queryFn: async () => api.bookmarks.get(bookmarkId),
    queryKey: ['bookmark', bookmarkId]
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  const bookmark = data?.bookmark

  return (
    <div>
      <h1>{bookmark?.title}</h1>
      <a href={bookmark?.url}>{bookmark?.url}</a>
      {bookmark?.note && <p>{bookmark.note}</p>}
      <div>Tags: {bookmark?.tags.join(', ')}</div>
    </div>
  )
}

export const Route = createFileRoute('/bookmarks/$bookmarkId')({
  component: BookmarkDetailPage
})
