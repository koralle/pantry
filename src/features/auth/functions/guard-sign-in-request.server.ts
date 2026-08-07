import { PASSWORD_MAX_LENGTH } from '../domain/password-policy'

type NextHandler = () => Response | Promise<Response>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function guardSignInRequest(request: Request, next: NextHandler): Promise<Response> {
  const { pathname } = new URL(request.url)

  if (request.method !== 'POST' || !pathname.endsWith('/sign-in/email')) {
    return next()
  }

  const body = await request
    .clone()
    .json()
    .catch(() => undefined)

  if (!isRecord(body) || typeof body['password'] !== 'string') {
    return next()
  }

  if (body['password'].length <= PASSWORD_MAX_LENGTH) {
    return next()
  }

  return Response.json(
    {
      code: 'BAD_REQUEST',
      message: 'Password exceeds the maximum length.'
    },
    { status: 400 }
  )
}
