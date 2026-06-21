import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/bookmarks/new')({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <div>
      <h1>ブックマーク新規作成</h1>
      <form>
        <label>
          URL
          <input
            type='url'
            name='url'
            aria-label='URL'
            required
          />
        </label>
        <button type='submit'>保存</button>
      </form>
      <Link
        to='/'
        search={{ tagMode: 'and', sort: 'newest' }}>
        一覧へ戻る
      </Link>
    </div>
  )
}
