import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { api, type BookmarkSummary } from '../lib/api'

function BookmarksPage() {
  const { data, isLoading } = useQuery({
    queryFn: async () => api.bookmarks.list(),
    queryKey: ['bookmarks']
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Bookmarks</h1>
      {data?.items.map((bookmark: Readonly<BookmarkSummary>) => (
        <div key={bookmark.id}>
          <a href={bookmark.url}>{bookmark.title}</a>
          <div>{bookmark.tags.join(', ')}</div>
        </div>
      ))}
    </div>
  )
}

export const Route = createFileRoute('/')({ component: BookmarksPage })
