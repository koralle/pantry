import { expect, test, vi } from 'vitest'

import { PASSWORD_MAX_LENGTH, SIGN_IN_BODY_MAX_BYTES } from '../domain/password-policy'
import { guardSignInRequest } from './guard-sign-in-request.server'

function makeRequest(path: string, password: string): Request {
  return new Request(`https://pantry.example${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', password })
  })
}

function makeFormRequest(path: string, password: string): Request {
  return new Request(`https://pantry.example${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email: 'user@example.com', password }).toString()
  })
}

function makeStreamingRequest(body: string): Request {
  const encoder = new TextEncoder()
  const chunks: string[] = []
  for (let offset = 0; offset < body.length; offset += 256) {
    chunks.push(body.slice(offset, offset + 256))
  }

  return new Request('https://pantry.example/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: new ReadableStream({
      async start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk))
        }
        controller.close()
      }
    })
  })
}

test('rejects an over-limit sign-in password without calling the handler', async () => {
  const next = vi.fn(() => new Response('handled'))

  const response = await guardSignInRequest(
    makeRequest('/api/auth/sign-in/email', 'a'.repeat(PASSWORD_MAX_LENGTH + 1)),
    next
  )

  expect(response.status).toBe(400)
  expect(next).not.toHaveBeenCalled()
})

test('delegates a password at the maximum length', async () => {
  const handled = new Response('handled')
  const next = vi.fn(() => handled)

  const response = await guardSignInRequest(
    makeRequest('/api/auth/sign-in/email', 'a'.repeat(PASSWORD_MAX_LENGTH)),
    next
  )

  expect(response).toBe(handled)
  expect(next).toHaveBeenCalledOnce()
})

test('does not apply the guard to another auth endpoint', async () => {
  const handled = new Response('handled')
  const next = vi.fn(() => handled)

  const response = await guardSignInRequest(
    makeRequest('/api/auth/sign-up/email', 'a'.repeat(PASSWORD_MAX_LENGTH + 1)),
    next
  )

  expect(response).toBe(handled)
  expect(next).toHaveBeenCalledOnce()
})

test('rejects an over-limit form-urlencoded sign-in password', async () => {
  const next = vi.fn(() => new Response('handled'))

  const response = await guardSignInRequest(
    makeFormRequest('/api/auth/sign-in/email', 'a'.repeat(PASSWORD_MAX_LENGTH + 1)),
    next
  )

  expect(response.status).toBe(415)
  expect(next).not.toHaveBeenCalled()
})

test('rejects a non-JSON content type', async () => {
  const next = vi.fn(() => new Response('handled'))

  const request = new Request('https://pantry.example/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: `password=${  'a'.repeat(PASSWORD_MAX_LENGTH + 1)}`
  })

  const response = await guardSignInRequest(request, next)

  expect(response.status).toBe(415)
  expect(next).not.toHaveBeenCalled()
})

test('accepts application/json with a charset parameter', async () => {
  const handled = new Response('handled')
  const next = vi.fn(() => handled)

  const request = new Request('https://pantry.example/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ email: 'user@example.com', password: 'a'.repeat(PASSWORD_MAX_LENGTH) })
  })

  const response = await guardSignInRequest(request, next)

  expect(response).toBe(handled)
  expect(next).toHaveBeenCalledOnce()
})

test('rejects a body with an over-limit content-length', async () => {
  const next = vi.fn(() => new Response('handled'))

  const request = new Request('https://pantry.example/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body:
      JSON.stringify({ email: 'user@example.com', password: 'a'.repeat(PASSWORD_MAX_LENGTH) }) +
      ' '.repeat(SIGN_IN_BODY_MAX_BYTES)
  })

  const response = await guardSignInRequest(request, next)

  expect(response.status).toBe(413)
  expect(next).not.toHaveBeenCalled()
})

test('accepts a body at the exact byte limit', async () => {
  const handled = new Response('handled')
  const next = vi.fn(() => handled)

  const password = 'a'.repeat(PASSWORD_MAX_LENGTH)
  const emailPadding = SIGN_IN_BODY_MAX_BYTES - JSON.stringify({ email: '', password }).length
  const body = JSON.stringify({ email: 'a'.repeat(emailPadding), password })
  expect(body.length).toBe(SIGN_IN_BODY_MAX_BYTES)

  const request = new Request('https://pantry.example/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body
  })

  const response = await guardSignInRequest(request, next)

  expect(response).toBe(handled)
  expect(next).toHaveBeenCalledOnce()
})

test('rejects an over-limit streaming body without a content-length', async () => {
  const next = vi.fn(() => new Response('handled'))

  const request = makeStreamingRequest(
    JSON.stringify({
      email: 'user@example.com',
      password: 'a'.repeat(SIGN_IN_BODY_MAX_BYTES + 1)
    })
  )
  expect(request.headers.get('content-length')).toBeNull()

  const response = await guardSignInRequest(request, next)

  expect(response.status).toBe(413)
  expect(next).not.toHaveBeenCalled()
})

test('delegates malformed JSON', async () => {
  const handled = new Response('handled')
  const next = vi.fn(() => handled)

  const request = new Request('https://pantry.example/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"email":'
  })

  const response = await guardSignInRequest(request, next)

  expect(response).toBe(handled)
  expect(next).toHaveBeenCalledOnce()
})

test('delegates a body without a password field', async () => {
  const handled = new Response('handled')
  const next = vi.fn(() => handled)

  const request = new Request('https://pantry.example/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com' })
  })

  const response = await guardSignInRequest(request, next)

  expect(response).toBe(handled)
  expect(next).toHaveBeenCalledOnce()
})

test('delegates a body with a non-string password', async () => {
  const handled = new Response('handled')
  const next = vi.fn(() => handled)

  const request = new Request('https://pantry.example/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', password: 123 })
  })

  const response = await guardSignInRequest(request, next)

  expect(response).toBe(handled)
  expect(next).toHaveBeenCalledOnce()
})

test('leaves the original request body readable for the delegated handler', async () => {
  const request = makeRequest('/api/auth/sign-in/email', 'a'.repeat(PASSWORD_MAX_LENGTH))
  const next = vi.fn(async (req: Request) => {
    const body = (await req.json()) as { password: string }
    return new Response(body.password.length.toString())
  })

  const response = await guardSignInRequest(request, () => next(request))

  expect(response.status).toBe(200)
  expect(await response.text()).toBe(String(PASSWORD_MAX_LENGTH))
})

test('applies the length boundary in UTF-16 code units', async () => {
  const emoji = '😀'
  const handled = new Response('handled')
  const next = vi.fn(() => handled)

  const response = await guardSignInRequest(
    makeRequest('/api/auth/sign-in/email', emoji.repeat(64)),
    next
  )

  expect(response).toBe(handled)
  expect(next).toHaveBeenCalledOnce()
})

test('rejects a password over 128 UTF-16 code units', async () => {
  const emoji = '😀'
  const next = vi.fn(() => new Response('handled'))

  const response = await guardSignInRequest(
    makeRequest('/api/auth/sign-in/email', emoji.repeat(65)),
    next
  )

  expect(response.status).toBe(400)
  expect(next).not.toHaveBeenCalled()
})

test('does not apply the guard to a sign-in path with a trailing slash', async () => {
  const handled = new Response('handled')
  const next = vi.fn(() => handled)

  const response = await guardSignInRequest(
    makeRequest('/api/auth/sign-in/email/', 'a'.repeat(PASSWORD_MAX_LENGTH + 1)),
    next
  )

  expect(response).toBe(handled)
  expect(next).toHaveBeenCalledOnce()
})
