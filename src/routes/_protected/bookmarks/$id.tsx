import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/bookmarks/$id')({
  component: RouteComponent
})

function RouteComponent() {
  const { id } = Route.useParams()

  return (
    <div>
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
