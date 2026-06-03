import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { api, type Tag } from '../../lib/api'

function TagsPage() {
  const { data, isLoading } = useQuery({
    queryFn: async () => api.tags.list(),
    queryKey: ['tags']
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Tags</h1>
      {data?.items.map((tag: Readonly<Tag>) => (
        <div key={tag.id}>
          <span>{tag.name}</span>
          <span>({tag.count})</span>
        </div>
      ))}
    </div>
  )
}

export const Route = createFileRoute('/tags/')({ component: TagsPage })
