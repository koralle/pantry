import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect, Outlet, useRouter } from '@tanstack/react-router'
import { useTransition } from 'react'

import { authClient } from '../features/auth/auth-client'
import { getSession } from '../features/auth/auth.function'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()

    if (!session) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href }
      })
    }

    return { user: session.user }
  },
  component: () => <Layout />
})

function Layout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const [isPending, startTransition] = useTransition()

  const handleClick = async () => {
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
    <div>
      <button
        type='button'
        onClick={handleClick}
        disabled={isPending}>
        Sign Out
      </button>
      <Outlet />
    </div>
  )
}
