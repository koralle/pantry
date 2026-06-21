import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/bookmarks/$id/edit')({
  component: RouteComponent
})

function RouteComponent() {
  const { id } = Route.useParams()

  return (
    <div>
      <h1>ブックマーク編集</h1>
      <p>ID: {id}</p>
      <form>
        <label>
          タイトル
          <input
            type='text'
            name='title'
            aria-label='タイトル'
          />
        </label>
        <button type='submit'>更新</button>
      </form>
      <Link
        to='/bookmarks/$id'
        params={{ id }}>
        詳細へ戻る
      </Link>
    </div>
  )
}
