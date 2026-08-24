import { RPCHandler } from '@orpc/server/fetch'

import type { AppRouter } from './create-app-router'

let productionRouterPromise: Promise<AppRouter> | undefined

function getProductionRouter(): Promise<AppRouter> {
  productionRouterPromise ??= import('./router.server').then((module) => module.appRouter)
  return productionRouterPromise
}

/**
 * `handler.handle()` が返した Response をそのまま出す。
 * 自前の JSON で包むと、Set-Cookie や oRPC のステータス契約が途中で消える。
 * router を省略した場合だけ本番 router を動的 import し、
 * このモジュールを import する client 側コードに getDB / getAuth を混ぜない。
 */
export async function handleRpcRequest(request: Request, router?: AppRouter): Promise<Response> {
  const resolved = router ?? (await getProductionRouter())
  const handler = new RPCHandler(resolved)
  const { matched, response } = await handler.handle(request, {
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
