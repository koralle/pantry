import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/tags/new')({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <div>
      <h1>タグ新規登録</h1>
      <form>
        <label>
          タグ名
          <input
            type='text'
            name='name'
            aria-label='タグ名'
            required
          />
        </label>
        <button type='submit'>保存</button>
      </form>
      <Link
        to='/tags'
        search={{ limit: 50 as never, offset: 0 as never }}>
        一覧へ戻る
      </Link>
    </div>
  )
}
