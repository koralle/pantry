import { createFileRoute, Link } from '@tanstack/react-router'
import * as v from 'valibot'

import { bookmarkSearchSchema } from './-lib/bookmark-search-schema'

export const Route = createFileRoute('/_protected/')({
  validateSearch: (search) => v.parse(bookmarkSearchSchema, search),
  component: RouteComponent
})

function RouteComponent() {
  const search = Route.useSearch()

  return (
    <div>
      <h1>ブックマーク一覧</h1>
      <div>
        <p>検索: {search.q ?? '（なし）'}</p>
        <p>タグ: {search.tags?.join(', ') ?? '（なし）'}</p>
        <p>タグモード: {search.tagMode}</p>
        <p>並び順: {search.sort}</p>
      </div>
      <nav>
        <Link to='/bookmarks/new'>新規作成</Link>
      </nav>
    </div>
  )
}
