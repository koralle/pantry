import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useTransition } from 'react'

import { authClient } from '../lib/auth-client'

export function useSignOut() {
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

  return { handleSignOut, isPending }
}
