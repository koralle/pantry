# Password Input Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reject passwords longer than 128 characters before Better Auth sign-in hashing while keeping the client and server password policies aligned.

**Architecture:** Add side-effect-free shared password policy constants (`PASSWORD_MAX_LENGTH = 128`, `SIGN_IN_BODY_MAX_BYTES = 4096`). Use them in the Valibot client schema, Better Auth configuration, and a narrow request guard at the existing auth catch-all route because the current Better Auth sign-in implementation does not apply `maxPasswordLength` before hash/verify. The guard applies only to an exact `POST /api/auth/sign-in/email` path, accepts only `application/json`, reads the cloned body with a 4096-byte cap (Content-Length pre-check plus streaming cancel), and delegates all other requests unchanged. This closes the `application/x-www-form-urlencoded` bypass and bounds the guard's own memory/CPU use (hostile-review hardening, see commit history).

**Tech Stack:** TanStack Start, Better Auth, Valibot, Cloudflare Workers, Vitest.

---

## File Map

- Create: `src/features/auth/domain/password-policy.ts` — shared maximum password length and sign-in body byte cap.
- Modify: `src/features/auth/lib/sign-in-schema.ts` — enforce the shared maximum in client validation.
- Create: `src/features/auth/lib/sign-in-schema.test.ts` — client schema boundary tests.
- Create: `src/features/auth/functions/guard-sign-in-request.server.ts` — server-side pre-handler guard.
- Create: `src/features/auth/functions/guard-sign-in-request.server.test.ts` — guard delegation and rejection tests.
- Modify: `src/features/auth/functions/get-auth.server.ts` — configure Better Auth with the shared maximum.
- Modify: `src/routes/api/auth/$.ts` — apply the guard before the Better Auth handler.

### Task 1: Add the Shared Policy and Client Boundary

**Files:**

- Create: `src/features/auth/domain/password-policy.ts`
- Modify: `src/features/auth/lib/sign-in-schema.ts:1-15`
- Test: `src/features/auth/lib/sign-in-schema.test.ts`

- [ ] **Step 1: Write the failing schema boundary tests**

Create `src/features/auth/lib/sign-in-schema.test.ts` with tests for the accepted and rejected boundary:

```ts
import { expect, test } from 'vitest'
import { parse } from 'valibot'

import { PASSWORD_MAX_LENGTH } from '../domain/password-policy'
import { passwordSchema } from './sign-in-schema'

test('accepts a password at the maximum length', () => {
  const password = 'a'.repeat(PASSWORD_MAX_LENGTH)

  expect(parse(passwordSchema, password)).toBe(password)
})

test('rejects a password over the maximum length', () => {
  const password = 'a'.repeat(PASSWORD_MAX_LENGTH + 1)

  expect(() => parse(passwordSchema, password)).toThrow()
})
```

- [ ] **Step 2: Run the new test to verify it fails for the missing maximum**

Run:

```bash
pnpm vitest run src/features/auth/lib/sign-in-schema.test.ts
```

Expected: the over-limit test fails because `passwordSchema` currently has no `maxLength` action. The test file may also fail to compile until the shared policy module is created in the next step.

- [ ] **Step 3: Add the shared password policy constant**

Create `src/features/auth/domain/password-policy.ts`:

```ts
export const PASSWORD_MAX_LENGTH = 128
```

Keep this module free of framework, environment, and validation-library imports so it can be consumed by both browser and Worker code.

- [ ] **Step 4: Apply the shared maximum to the client schema**

Update `src/features/auth/lib/sign-in-schema.ts` to import `maxLength` from Valibot and the shared constant, then add the maximum after the existing minimum:

```ts
import {
  brand,
  email,
  InferOutput,
  maxLength,
  minLength,
  nonEmpty,
  object,
  pipe,
  string
} from 'valibot'

import { PASSWORD_MAX_LENGTH } from '../domain/password-policy'

export const passwordSchema = pipe(
  string('Please enter your password.'),
  nonEmpty('Please enter your password.'),
  minLength(8, 'Your password must have 8 characters or more.'),
  maxLength(PASSWORD_MAX_LENGTH, 'Your password must have 128 characters or fewer.'),
  brand('Password')
)
```

Preserve the existing email schema, password brand, minimum length, and exported types.

- [ ] **Step 5: Run the schema tests to verify the boundary passes**

Run:

```bash
pnpm vitest run src/features/auth/lib/sign-in-schema.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 6: Commit the shared policy and client validation**

```bash
git add src/features/auth/domain/password-policy.ts src/features/auth/lib/sign-in-schema.ts src/features/auth/lib/sign-in-schema.test.ts
git commit -m "fix(auth): bound client password input"
```

### Task 2: Guard the Server Sign-In Request Before Better Auth

**Files:**

- Create: `src/features/auth/functions/guard-sign-in-request.server.ts`
- Test: `src/features/auth/functions/guard-sign-in-request.server.test.ts`
- Modify: `src/routes/api/auth/$.ts:1-12`
- Modify: `src/features/auth/functions/get-auth.server.ts:7-26`

- [ ] **Step 1: Write failing tests for server rejection and delegation**

Create `src/features/auth/functions/guard-sign-in-request.server.test.ts` covering rejection, delegation, content-type gating, byte-cap bounding, and body-readability (16 tests; the suite below reflects the hardened guard):

```ts
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
    body: 'password=' + 'a'.repeat(PASSWORD_MAX_LENGTH + 1)
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
```

The first test is the hash/verify boundary test: the fake `next` represents `getAuth().handler(request)`, so it must not be called for an oversized password. The form-urlencoded, non-JSON, and byte-cap tests are the hostile-review regression tests.

- [ ] **Step 2: Run the guard tests to verify they fail before the guard exists**

Run:

```bash
pnpm vitest run src/features/auth/functions/guard-sign-in-request.server.test.ts
```

Expected: the test file fails because `guard-sign-in-request.server.ts` and `guardSignInRequest` do not exist yet (initially also because `SIGN_IN_BODY_MAX_BYTES` is missing from the policy module). After adding the constants, the remaining failures must be behavioral only: form-urlencoded/non-JSON delegation (415 expected), and unbounded body acceptance (413 expected).

- [ ] **Step 3: Implement the request guard**

Create `src/features/auth/functions/guard-sign-in-request.server.ts`:

```ts
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
```

The guard rejects non-JSON content types (`415`) before any body processing, checks `Content-Length` before reading, and cancels the cloned stream once it exceeds the byte cap (`413`) so the guard's own memory use is bounded. The clone keeps a valid request readable by Better Auth. Only an over-limit string password is rejected with `400` (`PASSWORD_TOO_LONG`); malformed or structurally invalid requests continue to Better Auth's existing validation. The sequential stream reads are written as a small recursive helper (`readNextChunk`) so the guard stays free of `no-await-in-loop` and `max-statements` warnings; the recursion depth is bounded by `SIGN_IN_BODY_MAX_BYTES / chunk size`.

- [ ] **Step 4: Run the guard tests to verify they pass**

Run:

```bash
pnpm vitest run src/features/auth/functions/guard-sign-in-request.server.test.ts
```

Expected: 16 tests pass.

- [ ] **Step 5: Configure Better Auth with the shared maximum**

In `src/features/auth/functions/get-auth.server.ts`, import `PASSWORD_MAX_LENGTH` from `../domain/password-policy` and configure:

```ts
emailAndPassword: {
  enabled: true,
  maxPasswordLength: PASSWORD_MAX_LENGTH
}
```

Do not remove the existing `enabled: true` setting or alter the database and plugin configuration.

- [ ] **Step 6: Connect the guard to the existing POST auth handler**

In `src/routes/api/auth/$.ts`, import `guardSignInRequest` and replace the inline POST delegation with:

```ts
POST: async ({ request }: { request: Request }) =>
  guardSignInRequest(request, () => getAuth().handler(request))
```

Keep the GET handler unchanged. The guard itself checks the endpoint path, so the catch-all route remains compatible with other POST auth endpoints.

- [ ] **Step 7: Run the auth-related tests and typecheck**

Run:

```bash
pnpm vitest run src/features/auth
pnpm run typecheck
```

Expected: all auth tests pass and TypeScript exits successfully.

- [ ] **Step 8: Commit the server boundary**

```bash
git add src/features/auth/functions/guard-sign-in-request.server.ts src/features/auth/functions/guard-sign-in-request.server.test.ts src/features/auth/functions/get-auth.server.ts src/routes/api/auth/\$.ts
git commit -m "fix(auth): reject oversized sign-in passwords"
```

### Task 3: Run the Repository Verification Suite

**Files:**

- No additional files; verify the changes from Tasks 1 and 2.

- [ ] **Step 1: Run the complete test suite**

Run:

```bash
pnpm run test
```

Expected: the baseline 80 tests plus the new schema and guard tests pass with zero failures (98 tests total).

- [ ] **Step 2: Run formatting, lint, markup lint, and typecheck**

Run:

```bash
pnpm run format:check
pnpm run lint
pnpm run lint:markup
pnpm run typecheck
```

Expected: all commands exit with status 0.

- [ ] **Step 3: Run the production build**

Run:

```bash
pnpm run build
```

Expected: Vite produces the Worker build without TypeScript, route, or bundling errors.

- [ ] **Step 4: Inspect the final diff and status**

Run:

```bash
git status --short --branch
```

Confirm that only the shared password policy, client schema, server guard, Better Auth configuration, route wiring, and their tests changed. Do not stage unrelated files.
