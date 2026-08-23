import { createFileRoute } from '@tanstack/react-router'

import { handleRpcRequest } from '../../../rpc/handle-request.server'

/**
 * Cookie を読む認証 middleware のため、Request を丸ごと handler へ渡す。
 * GET も受けるのは oRPC の probe 用で、CreateTag 本体は POST。
 */
export const Route = createFileRoute('/api/rpc/$')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => handleRpcRequest(request),
      POST: async ({ request }: { request: Request }) => handleRpcRequest(request)
    }
  }
})
