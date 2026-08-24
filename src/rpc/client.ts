import { createORPCClient, ORPCError, onError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'

import type { AppRouter } from './create-app-router'

function redirectToSignIn(): void {
  if (typeof window === 'undefined') {
    return
  }

  const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const signIn = new URL('/sign-in/', window.location.origin)
  signIn.searchParams.set('redirect', redirect)
  window.location.replace(signIn)
}

const link = new RPCLink({
  url: () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/rpc`
    }

    // SSR では url を使わない。ssrRpcFetch が process 内の handler へ直接流す。
    return 'http://pantry.internal/api/rpc'
  },
  // 呼び出し毎に解決する。構築時に bind すると、あとから差し替えられた
  // global fetch（テストや Storybook の stub）を拾えない。
  fetch: (request, init) => {
    if (import.meta.env.SSR) {
      return import('./ssr-rpc-fetch.server').then(({ ssrRpcFetch }) => ssrRpcFetch(request))
    }

    return globalThis.fetch(request, init)
  },
  interceptors: [
    onError((error) => {
      if (error instanceof ORPCError && error.defined && error.code === 'UNAUTHORIZED') {
        redirectToSignIn()
      }
    })
  ]
})

/** Browser と SSR の両方で同じ AppRouter 契約を使う runtime client。 */
export const rpcClient: RouterClient<AppRouter> = createORPCClient(link)
