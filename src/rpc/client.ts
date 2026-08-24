import { createORPCClient, ORPCError, onError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'

import type { AppRouter } from './create-app-router'

/**
 * 期限切れセッションをフォームエラーにしない。
 * 今いる URL を `redirect` に載せ、戻ったあと作成し直せるようにする。
 */
function redirectToSignIn(): void {
  const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const signIn = new URL('/sign-in/', window.location.origin)
  signIn.searchParams.set('redirect', redirect)
  window.location.replace(signIn)
}

/**
 * Runtime の AppRouter は import しない。型だけ借りて、server handler を client bundle に入れない。
 * URL を lazy にするのは、SSR 中に CreateTag を投げて Cookie のない RPC が走らないようにするため。
 */
const link = new RPCLink({
  url: () => {
    if (typeof window === 'undefined') {
      throw new Error('CreateTag RPC client is browser-only')
    }

    return `${window.location.origin}/api/rpc`
  },
  // 呼び出し毎に解決する。構築時に bind すると、あとから差し替えられた
  // global fetch（テストや Storybook の stub）を拾えない。
  fetch: (request, init) => globalThis.fetch(request, init),
  interceptors: [
    onError((error) => {
      if (error instanceof ORPCError && error.defined && error.code === 'UNAUTHORIZED') {
        redirectToSignIn()
      }
    })
  ]
})

/** ブラウザ専用。SSR から呼ぶと Cookie のない RPC が走る。 */
export const rpcClient: RouterClient<AppRouter> = createORPCClient(link)
