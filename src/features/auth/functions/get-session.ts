import { createServerFn } from '@tanstack/react-start'

import { getRequestSession } from './request-session.server'

export const getSession = createServerFn({ method: 'GET' }).handler(async () => getRequestSession())
