import { createServerFn } from '@tanstack/react-start'

import { requireRequestSession } from './request-session.server'

export const ensureSession = createServerFn({ method: 'GET' }).handler(async () =>
  requireRequestSession()
)
