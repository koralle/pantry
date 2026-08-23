import { createTanstackQueryUtils } from '@orpc/tanstack-query'

import { rpcClient } from './client'

/**
 * MutationOptions の出所を client から切り離す。
 * 画面は oRPC の手順を知らなくてよく、成功時の refresh 方針だけを載せる。
 */
export const orpc = createTanstackQueryUtils(rpcClient)
