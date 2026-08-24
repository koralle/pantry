import { createFileRoute } from '@tanstack/react-router'

import { handleRpcRequest } from '../../../rpc/handle-request.server'

/**
 * Cookie を読む認証 middleware のため、Request を丸ごと handler へ渡す。
 * 書き込み procedure を CSRF に晒さないため POST 専用。GET は framework が 405 を返す。
 */
export const Route = createFileRoute('/api/rpc/$')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => handleRpcRequest(request)
    }
  }
})
