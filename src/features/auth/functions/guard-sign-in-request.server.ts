import { PASSWORD_MAX_LENGTH, SIGN_IN_BODY_MAX_BYTES } from '../domain/password-policy'

type NextHandler = () => Response | Promise<Response>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isJsonContentType(contentType: string | null): boolean {
  return contentType?.split(';')[0]?.trim().toLowerCase() === 'application/json'
}

function tooLargeResponse(): Response {
  return Response.json(
    {
      code: 'REQUEST_TOO_LARGE',
      message: 'Request body exceeds the maximum size.'
    },
    { status: 413 }
  )
}

async function readBodyBounded(request: Request): Promise<string | 'TOO_LARGE'> {
  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > SIGN_IN_BODY_MAX_BYTES) {
    return 'TOO_LARGE'
  }

  const stream = request.clone().body
  if (stream === null) {
    return ''
  }

  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    totalBytes += value.byteLength
    if (totalBytes > SIGN_IN_BODY_MAX_BYTES) {
      await reader.cancel()
      return 'TOO_LARGE'
    }
    chunks.push(value)
  }

  const merged = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(merged)
}

export async function guardSignInRequest(request: Request, next: NextHandler): Promise<Response> {
  const {pathname} = new URL(request.url)

  if (request.method !== 'POST' || pathname !== '/api/auth/sign-in/email') {
    return next()
  }

  if (!isJsonContentType(request.headers.get('content-type'))) {
    return Response.json(
      {
        code: 'INVALID_CONTENT_TYPE',
        message: 'Content type must be application/json.'
      },
      { status: 415 }
    )
  }

  const bodyText = await readBodyBounded(request)
  if (bodyText === 'TOO_LARGE') {
    return tooLargeResponse()
  }

  let body: unknown
  try {
    body = JSON.parse(bodyText)
  } catch {
    return next()
  }

  if (!isRecord(body) || typeof body['password'] !== 'string') {
    return next()
  }

  if (body['password'].length > PASSWORD_MAX_LENGTH) {
    return Response.json(
      {
        code: 'PASSWORD_TOO_LONG',
        message: 'Password exceeds the maximum length.'
      },
      { status: 400 }
    )
  }

  return next()
}
