# Password Input Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reject passwords longer than 128 characters before Better Auth sign-in hashing while keeping the client and server password policies aligned.

**Architecture:** Add a side-effect-free shared password policy constant. Use it in the Valibot client schema and Better Auth configuration, and add a narrow request guard at the existing auth catch-all route because the current Better Auth sign-in implementation does not apply `maxPasswordLength` before hash/verify. The guard inspects only `POST /api/auth/sign-in/email`, reads a cloned JSON body, and delegates all other requests unchanged.

**Tech Stack:** TanStack Start, Better Auth, Valibot, Cloudflare Workers, Vitest.

---

## File Map

- Create: `src/features/auth/domain/password-policy.ts` — shared maximum password length.
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

Create `src/features/auth/functions/guard-sign-in-request.server.test.ts`:

```ts
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
```

The first test is the hash/verify boundary test: the fake `next` represents `getAuth().handler(request)`, so it must not be called for an oversized password.

- [ ] **Step 2: Run the guard tests to verify they fail before the guard exists**

Run:

```bash
pnpm vitest run src/features/auth/functions/guard-sign-in-request.server.test.ts
```

Expected: the test file fails because `guard-sign-in-request.server.ts` and `guardSignInRequest` do not exist yet.

- [ ] **Step 3: Implement the request guard**

Create `src/features/auth/functions/guard-sign-in-request.server.ts`:

```ts
import { PASSWORD_MAX_LENGTH } from '../domain/password-policy'

type NextHandler = () => Response | Promise<Response>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function guardSignInRequest(request: Request, next: NextHandler): Promise<Response> {
  const pathname = new URL(request.url).pathname

  if (request.method !== 'POST' || !pathname.endsWith('/sign-in/email')) {
    return next()
  }

  const body = await request
    .clone()
    .json()
    .catch(() => undefined)

  if (!isRecord(body) || typeof body.password !== 'string') {
    return next()
  }

  if (body.password.length <= PASSWORD_MAX_LENGTH) {
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
```

Use the cloned request so a valid request remains readable by Better Auth. Only an over-limit string password is handled by this guard; malformed or structurally invalid requests continue to Better Auth's existing validation.

- [ ] **Step 4: Run the guard tests to verify they pass**

Run:

```bash
pnpm vitest run src/features/auth/functions/guard-sign-in-request.server.test.ts
```

Expected: 3 tests pass.

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

Expected: the baseline 80 tests plus the new schema and guard tests pass with zero failures.

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
