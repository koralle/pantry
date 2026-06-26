import { createFileRoute, Link, useRouterState } from '@tanstack/react-router'
import * as v from 'valibot'

const tagDetailSearchSchema = v.object({
  created: v.optional(v.boolean())
})

export const Route = createFileRoute('/_protected/tags/$id/')({
  validateSearch: tagDetailSearchSchema,
  component: RouteComponent
})

function RouteComponent() {
  const { id } = Route.useParams()

  const { newTagCreated } = useRouterState({
    select: (s) => s.location.state
  })

  return (
    <div>
      {newTagCreated && <div role='alert'>タグを登録しました</div>}

      <h1>タグ詳細</h1>

      <p>ID: {id}</p>

      <nav>
        <Link
          to='/tags/$id/edit'
          params={{ id }}>
          編集
        </Link>

        <Link
          to='/tags'
          search={{ limit: 50, offset: 0 }}>
          一覧へ戻る
        </Link>
      </nav>
    </div>
  )
}
