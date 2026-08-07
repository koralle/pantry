import { expect, test, vi } from 'vitest'

import { PASSWORD_MAX_LENGTH } from '../domain/password-policy'
import { guardSignInRequest } from './guard-sign-in-request.server'

function makeRequest(path: string, password: string): Request {
  return new Request(`https://pantry.example${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', password })
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
