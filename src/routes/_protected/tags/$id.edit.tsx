import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/tags/$id/edit')({
  component: RouteComponent
})

function RouteComponent() {
  const { id } = Route.useParams()

  return (
    <div>
      <h1>タグ編集</h1>
      <p>ID: {id}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}>
        <label>
          タグ名
          <input
            type='text'
            name='name'
            aria-label='タグ名'
          />
        </label>
        <button type='submit'>更新</button>
      </form>
      <Link
        to='/tags'
        search={{ limit: 50, offset: 0 }}>
        一覧へ戻る
      </Link>
    </div>
  )
}
