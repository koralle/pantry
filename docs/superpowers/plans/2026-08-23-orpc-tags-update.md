# UpdateTag oRPC Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the UpdateTag TanStack Start Server Function with the PR #224 oRPC architecture while preserving authenticated ownership, race-safe normalized-name conflicts, UI behavior, and server-only bundle boundaries.

**Architecture:** The oRPC procedure validates wire input and auth, then calls an Application use case that depends only on an `UpdateTag` function port. A libsql adapter performs the ownership check and `UPDATE OR IGNORE ... RETURNING` inside one transaction, so the database unique constraint is the conflict authority without a duplicate-name SELECT or SQLite error parsing. The React screen uses TanStack Query mutation options, code-only error mapping, and best-effort route refresh.

**Tech Stack:** TypeScript 7, Valibot, oRPC 1.15.0, TanStack Query/Router, Drizzle ORM, libsql, Vitest, React 19.

---

## File Map

| Responsibility                       | File                                                                                                                                                                                                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Input, command, port, Result mapping | `src/features/tags/application/update-tag.ts`                                                                                                                                                                                                            |
| Application unit tests               | `src/features/tags/application/update-tag.test.ts`                                                                                                                                                                                                       |
| libsql update adapter                | `src/features/tags/persistence/update-tag.ts`                                                                                                                                                                                                            |
| Real SQLite constraint tests         | `src/features/tags/persistence/update-tag.test.ts`                                                                                                                                                                                                       |
| Procedure and injectable dependency  | `src/rpc/create-app-router.ts`                                                                                                                                                                                                                           |
| Production adapter wiring            | `src/rpc/router.server.ts`                                                                                                                                                                                                                               |
| HTTP contract tests                  | `src/rpc/update-tag.test.ts`                                                                                                                                                                                                                             |
| Code-only UI message mapping         | `src/features/tags/lib/get-update-tag-error-message.ts`                                                                                                                                                                                                  |
| Message mapping tests                | `src/features/tags/lib/get-update-tag-error-message.test.ts`                                                                                                                                                                                             |
| Best-effort refresh                  | `src/features/tags/lib/refresh-after-update-tag.ts`                                                                                                                                                                                                      |
| Refresh tests                        | `src/features/tags/lib/refresh-after-update-tag.test.ts`                                                                                                                                                                                                 |
| Mutation owner                       | `src/features/tags/components/edit-tag-screen.tsx`                                                                                                                                                                                                       |
| Form error mapping                   | `src/features/tags/components/edit-tag-form.tsx`                                                                                                                                                                                                         |
| Source boundary tests                | `src/features/tags/components/edit-tag-screen.test.ts`, `src/features/tags/components/edit-tag-form.test.ts`                                                                                                                                             |
| Node test project routing            | `vitest.config.ts`                                                                                                                                                                                                                                       |
| Removed transport                    | `src/features/tags/functions/update-tag.ts`                                                                                                                                                                                                              |
| Removed legacy error helpers         | `src/features/tags/lib/is-sqlite-unique-constraint-error.ts`, `src/features/tags/lib/is-sqlite-unique-constraint-error.test.ts`, `src/features/tags/lib/tag-name-already-exists-error.ts`, `src/features/tags/lib/tag-name-already-exists-error.test.ts` |

## Task 1: Application Boundary

**Files:**

- Create: `src/features/tags/application/update-tag.test.ts`
- Create: `src/features/tags/application/update-tag.ts`

- [ ] **Step 1: Write the failing Application tests**

Create `src/features/tags/application/update-tag.test.ts` with these behaviors:

```ts
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { userIdSchema } from '../../auth/domain/auth-values'
import { tagIdSchema, tagNameSchema } from '../domain/tag-values'
import { executeUpdateTag, toUpdateTagCommand, updateTagInputSchema } from './update-tag'
import type { UpdateTag, UpdateTagInput, UpdateTagOutput } from './update-tag'

function parseInput(input: unknown) {
  return v.parse(updateTagInputSchema, input)
}

function fakeUpdateTag(output: UpdateTagOutput): UpdateTag {
  return async (_input: UpdateTagInput) => output
}

const userId = v.parse(userIdSchema, 'user-1')
const tagId = v.parse(tagIdSchema, 7)

describe('toUpdateTagCommand', () => {
  test('wire inputをbranded commandへ変換する', () => {
    const command = toUpdateTagCommand(
      parseInput({ id: 7, name: ' Work ', pinned: false, sortOrder: 0, color: null })
    )

    expect(command).toEqual({
      id: tagId,
      name: v.parse(tagNameSchema, ' Work '),
      pinned: false,
      sortOrder: 0,
      color: null
    })
  })
})

describe('executeUpdateTag', () => {
  const command = toUpdateTagCommand(
    parseInput({ id: 7, name: 'Work', pinned: true, sortOrder: 3, color: '#fff' })
  )

  test('updatedを更新済みTagIdへ写す', async () => {
    const result = await executeUpdateTag({
      updateTag: fakeUpdateTag({ kind: 'updated', id: tagId }),
      userId,
      command
    })

    expect(result).toEqual({ ok: true, value: { id: tagId } })
  })

  test('name-conflictをtag-name-already-existsへ写す', async () => {
    const result = await executeUpdateTag({
      updateTag: fakeUpdateTag({ kind: 'name-conflict' }),
      userId,
      command
    })

    expect(result).toEqual({
      ok: false,
      error: { code: 'tag-name-already-exists' }
    })
  })

  test('not-foundをtag-not-foundへ写す', async () => {
    const result = await executeUpdateTag({
      updateTag: fakeUpdateTag({ kind: 'not-found' }),
      userId,
      command
    })

    expect(result).toEqual({ ok: false, error: { code: 'tag-not-found' } })
  })

  test('全command値とuserIdをportへ渡す', async () => {
    let received: UpdateTagInput | undefined

    await executeUpdateTag({
      updateTag: async (input) => {
        received = input
        return { kind: 'updated', id: tagId }
      },
      userId,
      command
    })

    expect(received).toEqual({ userId, ...command })
  })

  test('portの未知障害はResultへ潰さない', async () => {
    await expect(
      executeUpdateTag({
        updateTag: async () => {
          throw new Error('database offline')
        },
        userId,
        command
      })
    ).rejects.toThrow('database offline')
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
pnpm exec vitest run src/features/tags/application/update-tag.test.ts
```

Expected: FAIL because `./update-tag` does not exist.

- [ ] **Step 3: Implement the minimal Application module**

Create `src/features/tags/application/update-tag.ts`:

```ts
import * as v from 'valibot'

import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
import type { UserId } from '../../auth/domain/auth-values'
import { tagIdSchema, tagNameSchema } from '../domain/tag-values'
import type { TagId, TagName } from '../domain/tag-values'

export const updateTagInputSchema = v.object({
  id: tagIdSchema,
  name: tagNameSchema,
  pinned: v.boolean(),
  sortOrder: v.number(),
  color: v.nullable(v.string())
})

export type UpdateTagWireInput = v.InferInput<typeof updateTagInputSchema>
export type UpdateTagValidatedInput = v.InferOutput<typeof updateTagInputSchema>

export type UpdateTagCommand = {
  readonly id: TagId
  readonly name: TagName
  readonly pinned: boolean
  readonly sortOrder: number
  readonly color: string | null
}

export type UpdatedTag = {
  readonly id: TagId
}

export type UpdateTagError =
  { readonly code: 'tag-name-already-exists' } | { readonly code: 'tag-not-found' }

export type UpdateTagInput = UpdateTagCommand & {
  readonly userId: UserId
}

export type UpdateTagOutput =
  | { readonly kind: 'updated'; readonly id: TagId }
  | { readonly kind: 'name-conflict' }
  | { readonly kind: 'not-found' }

export type UpdateTag = (input: UpdateTagInput) => Promise<UpdateTagOutput>

export function toUpdateTagCommand(input: UpdateTagValidatedInput): UpdateTagCommand {
  return {
    id: input.id,
    name: input.name,
    pinned: input.pinned,
    sortOrder: input.sortOrder,
    color: input.color
  }
}

export async function executeUpdateTag(params: {
  readonly updateTag: UpdateTag
  readonly userId: UserId
  readonly command: UpdateTagCommand
}): Promise<Result<UpdatedTag, UpdateTagError>> {
  const output = await params.updateTag({
    userId: params.userId,
    ...params.command
  })

  if (output.kind === 'name-conflict') {
    return err({ code: 'tag-name-already-exists' })
  }

  if (output.kind === 'not-found') {
    return err({ code: 'tag-not-found' })
  }

  return ok({ id: output.id })
}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run:

```bash
pnpm exec vitest run src/features/tags/application/update-tag.test.ts
```

Expected: PASS, including the unknown-error rejection test.

- [ ] **Step 5: Commit the Application boundary**

```bash
git add src/features/tags/application/update-tag.ts src/features/tags/application/update-tag.test.ts
git commit -m "feat(tags): add UpdateTag application boundary"
```

## Task 2: Race-Safe Persistence Adapter

**Files:**

- Create: `src/features/tags/persistence/update-tag.test.ts`
- Create: `src/features/tags/persistence/update-tag.ts`

- [ ] **Step 1: Write the failing real-SQLite tests**

Create `src/features/tags/persistence/update-tag.test.ts` with these helpers before the tests:

```ts
const persistenceDir = dirname(fileURLToPath(import.meta.url))

function parseUserId(value: string) {
  return v.parse(userIdSchema, value)
}

async function createMemoryDb() {
  const client = createClient({ url: ':memory:' })
  const db = drizzle({ client })

  await db.run(sql`
    CREATE TABLE users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      role TEXT,
      banned INTEGER,
      ban_reason TEXT,
      ban_expires INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  await db.run(sql`
    CREATE TABLE tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      color TEXT,
      last_used_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
      updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
      version INTEGER NOT NULL DEFAULT 1,
      UNIQUE (user_id, normalized_name)
    )
  `)

  return db
}

async function insertUser(db: Awaited<ReturnType<typeof createMemoryDb>>, id: string) {
  await db.insert(user).values({
    id,
    name: id,
    email: `${id}@example.com`
  })
}
```

Add these tests after the helpers:

```ts
describe('updateTag', () => {
  test('actorが所有するtagの全項目を更新する', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    const [tag] = await db
      .insert(tagsTable)
      .values({ userId: 'user-a', name: 'Old', normalizedName: 'old' })
      .returning({ id: tagsTable.id })

    if (tag === undefined) {
      throw new Error('Test tag was not inserted')
    }

    const result = await updateTag(db, {
      userId: parseUserId('user-a'),
      id: v.parse(tagIdSchema, tag.id),
      name: v.parse(tagNameSchema, 'New'),
      pinned: true,
      sortOrder: 4,
      color: '#112233'
    })

    expect(result).toEqual({ kind: 'updated', id: tag.id })
    const [updated] = await db.select().from(tagsTable).where(eq(tagsTable.id, tag.id))
    expect(updated).toMatchObject({
      name: 'New',
      normalizedName: 'new',
      pinned: true,
      sortOrder: 4,
      color: '#112233'
    })
  })

  test('実在しないtagはnot-foundを返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')

    await expect(
      updateTag(db, {
        userId: parseUserId('user-a'),
        id: v.parse(tagIdSchema, 99),
        name: v.parse(tagNameSchema, 'Missing'),
        pinned: false,
        sortOrder: 0,
        color: null
      })
    ).resolves.toEqual({ kind: 'not-found' })
  })

  test('別userのtagはnot-foundを返して変更しない', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertUser(db, 'user-b')
    const [tag] = await db
      .insert(tagsTable)
      .values({ userId: 'user-b', name: 'Private', normalizedName: 'private' })
      .returning({ id: tagsTable.id })

    if (tag === undefined) {
      throw new Error('Test tag was not inserted')
    }

    const result = await updateTag(db, {
      userId: parseUserId('user-a'),
      id: v.parse(tagIdSchema, tag.id),
      name: v.parse(tagNameSchema, 'Changed'),
      pinned: false,
      sortOrder: 0,
      color: null
    })

    expect(result).toEqual({ kind: 'not-found' })
    const [unchanged] = await db.select().from(tagsTable).where(eq(tagsTable.id, tag.id))
    expect(unchanged?.name).toBe('Private')
  })

  test('正規化名の実制約競合はname-conflictを返して変更しない', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    const [left, right] = await db
      .insert(tagsTable)
      .values([
        { userId: 'user-a', name: 'Work', normalizedName: 'work' },
        { userId: 'user-a', name: 'Home', normalizedName: 'home' }
      ])
      .returning({ id: tagsTable.id })

    if (left === undefined || right === undefined) {
      throw new Error('Test tags were not inserted')
    }

    const result = await updateTag(db, {
      userId: parseUserId('user-a'),
      id: v.parse(tagIdSchema, right.id),
      name: v.parse(tagNameSchema, 'WORK'),
      pinned: true,
      sortOrder: 9,
      color: '#fff'
    })

    expect(result).toEqual({ kind: 'name-conflict' })
    const [unchanged] = await db.select().from(tagsTable).where(eq(tagsTable.id, right.id))
    expect(unchanged).toMatchObject({ name: 'Home', normalizedName: 'home' })
  })

  test('SQLite error classifierをimportしない', () => {
    const source = readFileSync(join(persistenceDir, 'update-tag.ts'), 'utf8')
    expect(source).not.toContain('isSqliteUniqueConstraintError')
    expect(source).not.toContain('TagNameAlreadyExistsError')
  })
})
```

Use these imports in the test in addition to the copied DDL helper imports:

```ts
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@libsql/client'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { user } from '../../../db/schema/auth-schema'
import { tagsTable } from '../../../db/schema/tag'
import { userIdSchema } from '../../auth/domain/auth-values'
import { tagIdSchema, tagNameSchema } from '../domain/tag-values'
import { updateTag } from './update-tag'
```

- [ ] **Step 2: Run the persistence test and verify RED**

Run:

```bash
pnpm exec vitest run --project node src/features/tags/persistence/update-tag.test.ts
```

Expected: FAIL because `./update-tag` does not exist.

- [ ] **Step 3: Implement the adapter**

Create `src/features/tags/persistence/update-tag.ts`:

```ts
import { and, eq, sql } from 'drizzle-orm'
import * as v from 'valibot'

import type { AppDb } from '../../../db/app-db'
import { tagsTable } from '../../../db/schema/tag'
import type { UpdateTagInput, UpdateTagOutput } from '../application/update-tag'
import { tagIdSchema } from '../domain/tag-values'

export async function updateTag(db: AppDb, input: UpdateTagInput): Promise<UpdateTagOutput> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(and(eq(tagsTable.id, input.id), eq(tagsTable.userId, input.userId)))
      .limit(1)

    if (existing === undefined) {
      return { kind: 'not-found' }
    }

    const rows = await tx.all<{ id: number }>(sql`
      UPDATE OR IGNORE tags
      SET
        name = ${input.name.display},
        normalized_name = ${input.name.normalized},
        pinned = ${input.pinned ? 1 : 0},
        sort_order = ${input.sortOrder},
        color = ${input.color},
        updated_at = cast(unixepoch('subsecond') * 1000 as integer)
      WHERE id = ${input.id} AND user_id = ${input.userId}
      RETURNING id
    `)

    const [updated] = rows
    if (updated === undefined) {
      return { kind: 'name-conflict' }
    }

    return {
      kind: 'updated',
      id: v.parse(tagIdSchema, updated.id)
    }
  })
}
```

- [ ] **Step 4: Run the persistence test and verify GREEN**

```bash
pnpm exec vitest run --project node src/features/tags/persistence/update-tag.test.ts
```

Expected: all five tests PASS against real SQLite constraints.

- [ ] **Step 5: Commit the adapter**

```bash
git add src/features/tags/persistence/update-tag.ts src/features/tags/persistence/update-tag.test.ts
git commit -m "feat(tags): persist race-safe tag updates"
```

## Task 3: oRPC Procedure and Production Wiring

**Files:**

- Modify: `src/rpc/create-app-router.ts`
- Modify: `src/rpc/router.server.ts`
- Create: `src/rpc/update-tag.test.ts`

- [ ] **Step 1: Write failing RPC contract tests**

Create `src/rpc/update-tag.test.ts` with these imports and the complete real `RPCLink` helper:

```ts
import { createORPCClient, ORPCError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import type { UpdateTag } from '../features/tags/application/update-tag'
import type { TagId } from '../features/tags/domain/tag-values'
import { createAppRouter } from './create-app-router'
import type { AppRouter } from './create-app-router'
import { handleRpcRequest } from './handle-request.server'

function createTestClient(router: AppRouter, headers?: HeadersInit) {
  let lastResponse: Response | undefined
  const link = new RPCLink({
    url: 'https://pantry.test/api/rpc',
    headers: () => new Headers(headers),
    fetch: async (request) => {
      const response = await handleRpcRequest(request, router)
      lastResponse = response.clone()
      return response
    }
  })
  const client: RouterClient<AppRouter> = createORPCClient(link)

  return {
    client,
    getResponse: () => {
      if (lastResponse === undefined) {
        throw new Error('RPC client did not perform a request')
      }

      return lastResponse
    }
  }
}
```

Use this router factory and input:

```ts
const input = {
  id: 7,
  name: 'Work',
  pinned: false,
  sortOrder: 0,
  color: null
}

function authenticatedRouter(updateTag: UpdateTag) {
  return createAppRouter({
    getSession: async () => ({ user: { id: 'user-1' } }),
    insertTag: async () => ({ kind: 'name-conflict' }),
    updateTag
  })
}
```

Add these tests:

```ts
test('updateの戻り値idはTagIdではなくnumberである', () => {
  type Output = Awaited<ReturnType<RouterClient<AppRouter>['tags']['update']>>
  expectTypeOf<Output['id']>().toEqualTypeOf<number>()
  expectTypeOf<Output['id']>().not.toEqualTypeOf<TagId>()
})

test('未認証は401 UNAUTHORIZEDを返す', async () => {
  const router = createAppRouter({
    getSession: async () => null,
    insertTag: async () => ({ kind: 'name-conflict' }),
    updateTag: async () => ({ kind: 'not-found' })
  })
  const { client, getResponse } = createTestClient(router)
  const rejected = await client.tags.update(input).then(
    () => null,
    (error: unknown) => error
  )

  expect(getResponse().status).toBe(401)
  expect(rejected).toBeInstanceOf(ORPCError)
  expect((rejected as ORPCError<string, unknown>).code).toBe('UNAUTHORIZED')
})

test('Cookieヘッダーが認証middlewareへ届く', async () => {
  const getSession = vi.fn(async (headers: Headers) => {
    expect(headers.get('cookie')).toBe('better-auth.session_token=abc')
    return { user: { id: 'user-1' } }
  })
  const router = createAppRouter({
    getSession,
    insertTag: async () => ({ kind: 'name-conflict' }),
    updateTag: async () => ({ kind: 'updated', id: 7 as never })
  })
  const { client } = createTestClient(router, {
    cookie: 'better-auth.session_token=abc'
  })

  await client.tags.update(input)

  expect(getSession).toHaveBeenCalledOnce()
})

test('不正な入力は4xxを返す', async () => {
  const { client, getResponse } = createTestClient(
    authenticatedRouter(async () => ({ kind: 'not-found' }))
  )

  await expect(client.tags.update({ ...input, name: '' })).rejects.toBeInstanceOf(Error)
  expect(getResponse().status).toBeGreaterThanOrEqual(400)
  expect(getResponse().status).toBeLessThan(500)
})

test('同名は409 tag-name-already-existsを返す', async () => {
  const { client, getResponse } = createTestClient(
    authenticatedRouter(async () => ({ kind: 'name-conflict' }))
  )
  const rejected = await client.tags.update(input).then(
    () => null,
    (error: unknown) => error
  )

  expect(getResponse().status).toBe(409)
  expect((rejected as ORPCError<string, unknown>).code).toBe('tag-name-already-exists')
})

test('対象なしは404 tag-not-foundを返す', async () => {
  const { client, getResponse } = createTestClient(
    authenticatedRouter(async () => ({ kind: 'not-found' }))
  )
  const rejected = await client.tags.update(input).then(
    () => null,
    (error: unknown) => error
  )

  expect(getResponse().status).toBe(404)
  expect((rejected as ORPCError<string, unknown>).code).toBe('tag-not-found')
})

test('未知障害は詳細を漏らさない500を返す', async () => {
  const { client, getResponse } = createTestClient(
    authenticatedRouter(async () => {
      throw new Error('database password leaked')
    })
  )

  await expect(client.tags.update(input)).rejects.toBeInstanceOf(Error)
  expect(getResponse().status).toBe(500)
  await expect(getResponse().text()).resolves.not.toContain('database password leaked')
})

test('成功時はplain number idを返す', async () => {
  const { client } = createTestClient(
    authenticatedRouter(async () => ({ kind: 'updated', id: 7 as never }))
  )
  await expect(client.tags.update(input)).resolves.toEqual({ id: 7 })
})
```

- [ ] **Step 2: Run the RPC test and verify RED**

```bash
pnpm exec vitest run src/rpc/update-tag.test.ts
```

Expected: FAIL because `tags.update` and `AppRouterDeps.updateTag` do not exist.

- [ ] **Step 3: Add the procedure**

Modify `src/rpc/create-app-router.ts` as follows:

```ts
import {
  executeUpdateTag,
  toUpdateTagCommand,
  updateTagInputSchema
} from '../features/tags/application/update-tag'
import type { UpdateTag } from '../features/tags/application/update-tag'
```

Add the dependency and output type:

```ts
export type AppRouterDeps = {
  readonly getSession: GetSession
  readonly insertTag: InsertTag
  readonly updateTag: UpdateTag
}

export type UpdateTagOutput = {
  readonly id: number
}
```

Inside `createAppRouter`, after `createTag`, add:

```ts
const updateTag = base
  .use(requireAuth)
  .input(updateTagInputSchema)
  .errors({
    'tag-name-already-exists': { status: 409 },
    'tag-not-found': { status: 404 }
  })
  .handler(async ({ input, context, errors }) => {
    const result = await executeUpdateTag({
      updateTag: deps.updateTag,
      userId: context.userId as UserId,
      command: toUpdateTagCommand(input)
    })

    if (!result.ok) {
      if (result.error.code === 'tag-name-already-exists') {
        throw errors['tag-name-already-exists']()
      }

      throw errors['tag-not-found']()
    }

    const output: UpdateTagOutput = {
      id: Number(result.value.id)
    }

    return output
  })
```

Return it next to create:

```ts
return {
  tags: {
    create: createTag,
    update: updateTag
  }
}
```

Update every existing `createAppRouter` test construction to provide a minimal `updateTag` stub.

Use `async () => ({ kind: 'not-found' })` where the test does not exercise UpdateTag.

- [ ] **Step 4: Wire the production adapter**

Modify `src/rpc/router.server.ts`:

```ts
import { updateTag } from '../features/tags/persistence/update-tag'
```

Add to `createAppRouter` dependencies:

```ts
updateTag: async (input) => updateTag(getDB(), input)
```

- [ ] **Step 5: Run RPC and existing CreateTag tests**

```bash
pnpm exec vitest run src/rpc/update-tag.test.ts src/rpc/create-tag.test.ts
```

Expected: both files PASS; 500 response body does not contain the thrown message.

- [ ] **Step 6: Commit the RPC boundary**

```bash
git add src/rpc/create-app-router.ts src/rpc/router.server.ts src/rpc/create-tag.test.ts src/rpc/update-tag.test.ts
git commit -m "feat(tags): expose UpdateTag through oRPC"
```

## Task 4: React Mutation and Error Contract

**Files:**

- Create: `src/features/tags/lib/get-update-tag-error-message.test.ts`
- Create: `src/features/tags/lib/get-update-tag-error-message.ts`
- Create: `src/features/tags/lib/refresh-after-update-tag.test.ts`
- Create: `src/features/tags/lib/refresh-after-update-tag.ts`
- Create: `src/features/tags/components/edit-tag-screen.test.ts`
- Create: `src/features/tags/components/edit-tag-form.test.ts`
- Modify: `src/features/tags/components/edit-tag-screen.tsx`
- Modify: `src/features/tags/components/edit-tag-form.tsx`
- Modify: `vitest.config.ts`
- Delete: `src/features/tags/functions/update-tag.ts`
- Delete legacy error helper files if `grep` confirms no remaining import.

- [ ] **Step 1: Write failing mapper and refresh tests**

Create `src/features/tags/lib/get-update-tag-error-message.test.ts`:

```ts
import { ORPCError } from '@orpc/client'
import { describe, expect, test } from 'vitest'

import { getUpdateTagErrorMessage } from './get-update-tag-error-message'

describe('getUpdateTagErrorMessage', () => {
  test('Error class名では判定しない', () => {
    const error = new Error('duplicate')
    error.name = 'TagNameAlreadyExistsError'
    expect(getUpdateTagErrorMessage(error)).toBe('タグの更新に失敗しました')
  })

  test('UNAUTHORIZEDはnullを返す', () => {
    expect(
      getUpdateTagErrorMessage(new ORPCError('UNAUTHORIZED', { defined: true, status: 401 }))
    ).toBeNull()
  })

  test('tag-name-already-existsを同名エラーへ写す', () => {
    expect(
      getUpdateTagErrorMessage(
        new ORPCError('tag-name-already-exists', { defined: true, status: 409 })
      )
    ).toBe('そのタグ名は既に存在します')
  })

  test('tag-not-foundを対象なしへ写す', () => {
    expect(
      getUpdateTagErrorMessage(new ORPCError('tag-not-found', { defined: true, status: 404 }))
    ).toBe('更新するタグが見つかりません')
  })
})
```

Create `src/features/tags/lib/refresh-after-update-tag.test.ts`:

```ts
import { describe, expect, test, vi } from 'vitest'

import { refreshAfterUpdateTag } from './refresh-after-update-tag'

describe('refreshAfterUpdateTag', () => {
  test('routeの再取得が失敗してもrejectしない', async () => {
    const invalidate = vi.fn(() => Promise.reject(new Error('loader failed')))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      refreshAfterUpdateTag({ invalidate })
    }).not.toThrow()

    await vi.waitFor(() => {
      expect(invalidate).toHaveBeenCalledOnce()
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to refresh route data after UpdateTag',
        expect.any(Error)
      )
    })

    consoleError.mockRestore()
  })
})
```

- [ ] **Step 2: Write failing source boundary tests**

Create `src/features/tags/components/edit-tag-screen.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))

describe('EditTagScreen', () => {
  test('UpdateTagをoRPC mutationとして所有する', () => {
    const source = readFileSync(join(dir, 'edit-tag-screen.tsx'), 'utf8')

    expect(source).not.toContain('../functions/update-tag')
    expect(source).not.toContain('TagNameAlreadyExistsError')
    expect(source).not.toContain('error.name')
    expect(source).toContain('orpc.tags.update.mutationOptions')
    expect(source).toContain('refreshAfterUpdateTag')
  })
})
```

Create `src/features/tags/components/edit-tag-form.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))

describe('EditTagForm', () => {
  test('Errorのclass名ではなくoRPC code mapperを使う', () => {
    const source = readFileSync(join(dir, 'edit-tag-form.tsx'), 'utf8')

    expect(source).not.toContain('../functions/update-tag')
    expect(source).not.toContain('TagNameAlreadyExistsError')
    expect(source).not.toContain('error.name')
    expect(source).toContain('getUpdateTagErrorMessage')
  })
})
```

- [ ] **Step 3: Add source tests to the Node project and verify RED**

Replace `nodeTests` in `vitest.config.ts` with:

```ts
const nodeTests = [
  'src/features/tags/persistence/**/*.test.ts',
  'src/features/tags/components/new-tag-screen.test.ts',
  'src/features/tags/components/inline-add-tag.test.ts',
  'src/features/tags/components/edit-tag-screen.test.ts',
  'src/features/tags/components/edit-tag-form.test.ts'
]
```

Run:

```bash
pnpm exec vitest run --project node src/features/tags/components/edit-tag-screen.test.ts src/features/tags/components/edit-tag-form.test.ts
pnpm exec vitest run src/features/tags/lib/get-update-tag-error-message.test.ts src/features/tags/lib/refresh-after-update-tag.test.ts
```

Expected: FAIL because the UI still imports the Server Function and the helpers do not exist.

- [ ] **Step 4: Implement the helpers**

Create `get-update-tag-error-message.ts`:

```ts
import { ORPCError } from '@orpc/client'

export function getUpdateTagErrorMessage(error: unknown): string | null {
  if (error instanceof ORPCError && error.defined) {
    if (error.code === 'UNAUTHORIZED') {
      return null
    }

    if (error.code === 'tag-name-already-exists') {
      return 'そのタグ名は既に存在します'
    }

    if (error.code === 'tag-not-found') {
      return '更新するタグが見つかりません'
    }
  }

  return 'タグの更新に失敗しました'
}
```

Create `refresh-after-update-tag.ts`:

```ts
export function refreshAfterUpdateTag(router: { invalidate: () => Promise<unknown> }): void {
  void router.invalidate().catch((error: unknown) => {
    console.error('Failed to refresh route data after UpdateTag', error)
  })
}
```

- [ ] **Step 5: Replace the React transport**

In `edit-tag-screen.tsx`:

```ts
import { useMutation } from '@tanstack/react-query'
import { orpc } from '../../../rpc/query'
import { refreshAfterUpdateTag } from '../lib/refresh-after-update-tag'
```

Remove the `updateTag` Server Function import.

Inside `EditTagScreen`, create the mutation:

```ts
const mutation = useMutation(
  orpc.tags.update.mutationOptions({
    onSuccess: () => {
      refreshAfterUpdateTag(router)
    }
  })
)
```

Replace the body of `submitAction` with:

```ts
const { id: updatedId } = await mutation.mutateAsync(input)

await navigate({
  to: '/tags/$id',
  params: { id: String(updatedId) },
  state: { tagUpdated: true }
})
```

Do not await `router.invalidate()`.

In `edit-tag-form.tsx`, import `getUpdateTagErrorMessage` and replace the inline mapper with:

```tsx
mapError = { getUpdateTagErrorMessage }
```

- [ ] **Step 6: Delete the old transport and dead error helpers**

Delete `src/features/tags/functions/update-tag.ts`.

Search all source files for both legacy helpers:

```bash
rg "isSqliteUniqueConstraintError|TagNameAlreadyExistsError" src --glob '!*.test.ts'
```

Expected before deletion: only the two helper implementation files remain; tests are excluded by the glob.

Delete these four files when that expectation is met:

```text
src/features/tags/lib/is-sqlite-unique-constraint-error.ts
src/features/tags/lib/is-sqlite-unique-constraint-error.test.ts
src/features/tags/lib/tag-name-already-exists-error.ts
src/features/tags/lib/tag-name-already-exists-error.test.ts
```

- [ ] **Step 7: Run UI/helper tests and verify GREEN**

```bash
pnpm exec vitest run --project node src/features/tags/components/edit-tag-screen.test.ts src/features/tags/components/edit-tag-form.test.ts
pnpm exec vitest run src/features/tags/lib/get-update-tag-error-message.test.ts src/features/tags/lib/refresh-after-update-tag.test.ts
```

Expected: all tests PASS.

- [ ] **Step 8: Commit the UI migration**

```bash
git add src/features/tags/components src/features/tags/lib src/features/tags/functions/update-tag.ts vitest.config.ts
git commit -m "feat(tags): use oRPC for tag updates"
```

## Task 5: Full Verification and PR

**Files:**

- Verify all files changed by Tasks 1-4.
- Update: PR body only; do not add another source file.

- [ ] **Step 1: Verify architectural source boundaries**

```bash
rg "AppDb|drizzle-orm|@orpc|@tanstack|React|Cookie|HTTP" src/features/tags/application/update-tag.ts
rg "functions/update-tag|error\.name|TagNameAlreadyExistsError" src --glob '!*.test.ts'
```

Expected: both commands produce no matches.

- [ ] **Step 2: Run the required repository checks**

```bash
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

Expected: all commands exit 0 with no test failures.

- [ ] **Step 3: Inspect the browser bundle**

```bash
rg -l "drizzle-orm|@libsql|better-auth|createAppRouter|getDB|updateTag\(getDB" dist/client
```

Expected: no client chunk matches.

- [ ] **Step 4: Run manual browser checks**

Run `pnpm run dev` in the Herdr pane and verify:

```text
1. /tags/:id/edit updates name, pin, color, and sort order.
2. Renaming to another tag's name, including case-only variants, shows the duplicate-name message.
3. An expired session redirects to /sign-in?redirect=... without a generic form error.
4. Injected RPC 500 behavior shows only the generic update failure text.
5. The form remains usable at desktop and mobile widths.
```

- [ ] **Step 5: Review the complete diff**

```bash
git status --short
git diff main...HEAD --stat
git diff main...HEAD
```

Expected: only UpdateTag migration files and the already-approved migration design/plan are present.

- [ ] **Step 6: Push and create the PR**

Use branch `feat/orpc-tags-update` and a PR body with PR #224's sections:

```markdown
## Summary

- Send UpdateTag through oRPC and TanStack Query.
- Keep normalized-name conflict classification on the real SQLite constraint with UPDATE OR IGNORE.
- Remove the UpdateTag Server Function and Error class-name UI contract.

## Test plan

- [x] `pnpm run format:check`
- [x] `pnpm run lint`
- [x] `pnpm run typecheck`
- [x] `pnpm run test`
- [x] `pnpm run build`
- [x] RPC 401 / 409 / 404 / safe 500 contract
- [x] Browser bundle server-only scan
- [x] Manual desktop/mobile UpdateTag flow

## Auth / security

- [x] oRPC middleware validates the session.
- [x] Persistence scopes existence and update by `userId`.
- [x] Unknown failures do not expose internal details.

## Server Function / domain

- [x] Removed `src/features/tags/functions/update-tag.ts`.
- [x] Application depends only on the `UpdateTag` function port.
- [x] Duplicate names use the database constraint, not a duplicate pre-SELECT.

## UI

- [x] Uses `orpc.tags.update.mutationOptions`.
- [x] Uses error codes, not `Error.name`.
- [x] Refresh failure cannot turn a committed update into mutation failure.
```

Write the PR body above to `/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/orpc-tags-update-pr.md`, then run:

```bash
git push -u origin feat/orpc-tags-update
gh pr create --base main --head feat/orpc-tags-update --title "feat: send UpdateTag through oRPC" --body-file "/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/orpc-tags-update-pr.md"
```

Expected: `gh` returns the new PR URL.
