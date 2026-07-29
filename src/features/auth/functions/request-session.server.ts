import { getRequestHeaders } from '@tanstack/react-start/server'

import { getAuth } from './get-auth.server'

export async function getRequestSession() {
  const headers = getRequestHeaders()
  return getAuth().api.getSession({ headers })
}

export async function requireRequestSession() {
  const session = await getRequestSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}
