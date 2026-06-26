import { createFileRoute, Link, useRouterState } from '@tanstack/react-router'
import * as v from 'valibot'

const bookmarkDetailSearchSchema = v.object({
  created: v.optional(v.boolean())
})

export const Route = createFileRoute('/_protected/bookmarks/$id/')({
  validateSearch: bookmarkDetailSearchSchema,
  component: RouteComponent
})

function RouteComponent() {
  const { id } = Route.useParams()

  const { newBookmarkCreated, bookmarkUpdated } = useRouterState({
    select: (s) => s.location.state
  })

  return (
    <div>
      {newBookmarkCreated && <div role='alert'>ブックマークを登録しました</div>}
      {bookmarkUpdated && <div role='alert'>ブックマークを更新しました</div>}

      <h1>ブックマーク詳細</h1>

      <p>ID: {id}</p>

      <nav>
        <Link
          to='/bookmarks/$id/edit'
          params={{ id }}>
          編集
        </Link>

        <Link
          to='/'
          search={{ tagMode: 'and', sort: 'newest' }}>
          一覧へ戻る
        </Link>
      </nav>
    </div>
  )
}
