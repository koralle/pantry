import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { getRequestHeaders } from '@tanstack/react-start/server'

import type { AppRouter } from './create-app-router'
import { handleRpcRequest } from './handle-request.server'

/**
 * SSR 用の direct client。link の fetch を process 内の handler へ繋ぐため
 * ネットワークを経路せず、request headers（Cookie）だけを procedure へ渡す。
 * URL は prefix 判定のためで、実際には fetch されない。
 */
export function createServerRpcClient(
  headersProvider: () => Headers,
  router?: AppRouter
): RouterClient<AppRouter> {
  const link = new RPCLink({
    url: 'http://pantry.internal/api/rpc',
    headers: headersProvider,
    fetch: async (request) => handleRpcRequest(request, router)
  })

  return createORPCClient(link)
}

/**
 * 本番では request context の外で生成しない。headers provider は呼び出し毎に解決する。
 */
export const serverRpcClient = createServerRpcClient(() => getRequestHeaders())
