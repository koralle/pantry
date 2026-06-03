import { createFileRoute } from '@tanstack/react-router'

function EditBookmarkPage() {
  const { bookmarkId } = Route.useParams()

  return <h1>Edit Bookmark: {bookmarkId}</h1>
}

export const Route = createFileRoute('/bookmarks/$bookmarkId/edit')({
  component: EditBookmarkPage
})
