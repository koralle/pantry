import { createORPCClient, ORPCError, onError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { createIsomorphicFn } from '@tanstack/react-start'

import type { AppRouter } from './create-app-router'

const rpcFetch = createIsomorphicFn()
  .server(async (request: Request, _init?: RequestInit) => {
    const { ssrRpcFetch } = await import('./ssr-rpc-fetch.server')
    return ssrRpcFetch(request)
  })
  .client((request: Request, init?: RequestInit) => globalThis.fetch(request, init))

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

    // SSR では url を使わない。rpcFetch の server 実装が process 内の handler へ直接流す。
    return 'http://pantry.internal/api/rpc'
  },
  // 呼び出し毎に解決する。構築時に bind すると、あとから差し替えられた
  // global fetch（テストや Storybook の stub）を拾えない。
  fetch: (request, init) => rpcFetch(request, init),
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
