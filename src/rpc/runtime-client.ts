import type { RouterClient } from '@orpc/server'
import { createIsomorphicFn } from '@tanstack/react-start'

import { rpcClient } from './client'
import type { AppRouter } from './create-app-router'

/**
 * Loader / beforeLoad は SSR でも client navigation でも走る。
 * server では request headers を載せた direct client、browser では既存 rpcClient を使う。
 * server 実装は compiler が client bundle から落とすため、
 * client.server や Better Auth server が browser へ流れない。
 */
export const getRpcClient = createIsomorphicFn()
  .server(async (): Promise<RouterClient<AppRouter>> => {
    const { serverRpcClient } = await import('./client.server')
    return serverRpcClient
  })
  .client(async (): Promise<RouterClient<AppRouter>> => rpcClient)
