import { createFileRoute } from '@tanstack/react-router'

function NewBookmarkPage() {
  return <h1>New Bookmark</h1>
}

export const Route = createFileRoute('/bookmarks/new')({ component: NewBookmarkPage })
