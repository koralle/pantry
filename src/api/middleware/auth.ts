import type { MiddlewareHandler } from 'hono'

declare module 'hono' {
  interface ContextVariableMap {
    userId: string
  }
}

export const auth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('x-user-id')
  if (!authHeader) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }
  c.set('userId', authHeader)
  return (await next()) as unknown as void
}
