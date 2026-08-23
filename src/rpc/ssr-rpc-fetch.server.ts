import { getRequestHeaders } from '@tanstack/react-start/server'

import { handleRpcRequest } from './handle-request.server'

/**
 * SSR 中の oRPC 呼び出しを、HTTP 往復なしで同じ process の RPC handler へ流す。
 * ブラウザの RPCLink と同一の契約（procedure・status・TanStack Query key）を使うため、
 * loader / component は実行環境を意識しない。Cookie は元リクエストから転送する。
 */
export async function ssrRpcFetch(request: Request): Promise<Response> {
  const headers = new Headers(request.headers)
  const incomingCookie = getRequestHeaders().get('cookie')

  if (incomingCookie != null && !headers.has('cookie')) {
    headers.set('cookie', incomingCookie)
  }

  const body = request.method === 'GET' ? undefined : await request.arrayBuffer()

  return handleRpcRequest(
    new Request(request.url, {
      method: request.method,
      headers,
      ...(body !== undefined ? { body } : {})
    })
  )
}
