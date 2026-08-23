import { RPCHandler } from '@orpc/server/fetch'

import type { AppRouter } from './create-app-router'
import { appRouter } from './router.server'

/**
 * `handler.handle()` が返した Response をそのまま出す。
 * 自前の JSON で包むと、Set-Cookie や oRPC のステータス契約が途中で消える。
 */
export async function handleRpcRequest(
  request: Request,
  router: AppRouter = appRouter
): Promise<Response> {
  const handler = new RPCHandler(router),
   { matched, response } = await handler.handle(request, {
    prefix: '/api/rpc',
    context: {
      headers: request.headers
    }
  })

  if (!matched) {
    return new Response('Not Found', { status: 404 })
  }

  return response
}
