import { PASSWORD_MAX_LENGTH, SIGN_IN_BODY_MAX_BYTES } from '../domain/password-policy'

type NextHandler = () => Response | Promise<Response>

const SIGN_IN_EMAIL_PATH = '/api/auth/sign-in/email'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isJsonContentType(contentType: string | null): boolean {
  return contentType?.split(';')[0]?.trim().toLowerCase() === 'application/json'
}

function errorResponse(code: string, message: string, status: number): Response {
  return Response.json({ code, message }, { status })
}

function hasOverLimitContentLength(request: Request): boolean {
  const contentLength = Number(request.headers.get('content-length'))
  return Number.isFinite(contentLength) && contentLength > SIGN_IN_BODY_MAX_BYTES
}

function decodeChunks(chunks: Uint8Array[], totalBytes: number): string {
  const merged = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(merged)
}

async function readNextChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  chunks: Uint8Array[],
  totalBytes: number
): Promise<string | 'TOO_LARGE'> {
  const { done, value } = await reader.read()
  if (done) {
    return decodeChunks(chunks, totalBytes)
  }
  const nextTotal = totalBytes + value.byteLength
  if (nextTotal > SIGN_IN_BODY_MAX_BYTES) {
    await reader.cancel()
    return 'TOO_LARGE'
  }
  chunks.push(value)
  return readNextChunk(reader, chunks, nextTotal)
}

async function readBodyBounded(request: Request): Promise<string | 'TOO_LARGE'> {
  if (hasOverLimitContentLength(request)) {
    return 'TOO_LARGE'
  }

  const stream = request.clone().body
  if (stream === null) {
    return ''
  }

  return readNextChunk(stream.getReader(), [], 0)
}

function parsePassword(bodyText: string): unknown {
  try {
    return JSON.parse(bodyText)
  } catch {
    return undefined
  }
}

function isOverLimitPassword(body: unknown): boolean {
  if (!isRecord(body) || typeof body['password'] !== 'string') {
    return false
  }
  return body['password'].length > PASSWORD_MAX_LENGTH
}

function isSignInEmailRequest(request: Request): boolean {
  if (request.method !== 'POST') {
    return false
  }
  return new URL(request.url).pathname === SIGN_IN_EMAIL_PATH
}

async function runSignInEmailGuard(request: Request, next: NextHandler): Promise<Response> {
  if (!isJsonContentType(request.headers.get('content-type'))) {
    return errorResponse('INVALID_CONTENT_TYPE', 'Content type must be application/json.', 415)
  }

  const bodyText = await readBodyBounded(request)
  if (bodyText === 'TOO_LARGE') {
    return errorResponse('REQUEST_TOO_LARGE', 'Request body exceeds the maximum size.', 413)
  }

  const body = parsePassword(bodyText)
  if (isOverLimitPassword(body)) {
    return errorResponse('PASSWORD_TOO_LONG', 'Password exceeds the maximum length.', 400)
  }

  return next()
}

export async function guardSignInRequest(request: Request, next: NextHandler): Promise<Response> {
  if (!isSignInEmailRequest(request)) {
    return next()
  }
  return runSignInEmailGuard(request, next)
}
