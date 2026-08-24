import { createFileRoute } from '@tanstack/react-router'

import { getAuth } from '../../../features/auth/server/get-auth.server'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => getAuth().handler(request),
      POST: async ({ request }: { request: Request }) => getAuth().handler(request)
    }
  }
})
