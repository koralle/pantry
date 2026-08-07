import { createFileRoute } from '@tanstack/react-router'

import { getAuth } from '../../../features/auth/functions/get-auth.server'
import { guardSignInRequest } from '../../../features/auth/functions/guard-sign-in-request.server'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => getAuth().handler(request),
      POST: async ({ request }: { request: Request }) =>
        guardSignInRequest(request, () => getAuth().handler(request))
    }
  }
})
