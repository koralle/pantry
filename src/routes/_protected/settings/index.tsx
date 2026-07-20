import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useTransition } from 'react'

import { defaultBookmarkSearch } from '../-lib/bookmark-search-schema'
import { authClient } from '../../../features/auth/auth-client'
import { ensureSession } from '../../../features/auth/auth.function'

export const Route = createFileRoute('/_protected/settings/')({
  loader: async () => {
    const { user } = await ensureSession()
    return { user }
  },
  component: RouteComponent
})

function RouteComponent() {
  const { user } = Route.useLoaderData()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            queryClient.clear()
          }
        }
      })

      startTransition(async () => {
        await router.navigate({ to: '/sign-in' })
      })
    })
  }

  return (
    <div className='pantry-settings'>
      <h1 className='pantry-settings__title'>設定</h1>
      <p className='pantry-settings__lead'>アカウントと出口</p>

      <section className='pantry-settings__section'>
        <h2 className='pantry-settings__heading'>アカウント</h2>
        <dl className='pantry-settings__account'>
          <div>
            <dt>名前</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>メール</dt>
            <dd>{user.email}</dd>
          </div>
        </dl>
      </section>

      <section className='pantry-settings__section'>
        <h2 className='pantry-settings__heading'>セッション</h2>
        <button
          type='button'
          className='pantry-button pantry-button--accent'
          onClick={handleSignOut}
          disabled={isPending}>
          {isPending ? '退出中...' : 'Sign out'}
        </button>
      </section>

      <Link
        to='/'
        search={defaultBookmarkSearch}
        className='pantry-text-link'>
        玄関へ戻る
      </Link>
    </div>
  )
}
