import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/settings/')({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <div>
      <h1>設定</h1>
      <section>
        <h2>アカウント</h2>
        <p>アカウント設定をここに配置する</p>
      </section>
      <section>
        <h2>Better Auth 連携</h2>
        <p>連携状態をここに表示する</p>
      </section>
      <Link
        to='/'
        search={{ tagMode: 'and', sort: 'newest' }}>
        一覧へ戻る
      </Link>
    </div>
  )
}
