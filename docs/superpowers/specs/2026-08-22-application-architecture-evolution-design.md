# アプリケーションアーキテクチャ改善設計

## 1. 結論

Pantry のバックエンド境界を、現在の TanStack Start Server Function 直結構成から段階的に変更する。

採用する方針は次のとおり。

1. **oRPC を型付き RPC 境界として導入する**
2. **TanStack Query をサーバー状態へアクセスする標準経路として使う**
3. **Application / UseCase 層を設け、業務処理を TanStack Start と oRPC から分離する**
4. **Expected Error は既存の `src/shared/domain/result.ts` の `Result` で表現する**
5. **未認証・入力不正は Application Error に混ぜず、RPC 境界の失敗として扱う**
6. **Unexpected Error は `throw` のまま oRPC に渡し、500 変換を自前実装しない**
7. **Application から Drizzle を追い出す箇所では、汎用 Repository ではなく狭い function port を使う**
8. **単純な read projection は無理に UseCase / Repository 化せず query service として分離してよい**
9. **SSR は `createRouterClient` を使い、同一 Worker 内の HTTP round trip を避ける**
10. **Unexpected Error の logging は HTTP と SSR で共有できる server-side interceptor に置く**
11. **Hono は現時点では導入しない**

今回の設計では、既存実装との一貫性よりも **今後のテスタビリティ・依存方向・性能**を優先する。

既存の Bookmark Application は `AppDb` を直接注入しているが、その unit test では Drizzle の fluent API を模倣するために `createThenableChain` と `as unknown as AppDb` を使っている。

この状態は「Application を DB 実装から切り離してテストしたい」という今回の目的には合わない。

そのため CreateTag pilot では、既存パターンを踏襲せず **UseCase が本当に必要とする能力だけを port として渡す**。

---

## 2. 現在の問題

現在の `src/features/tags/functions/add-tag.ts` は、1つの Server Function の中で次を行っている。

- request から認証セッションを取得する
- DB を取得する
- 同名タグを事前に検索する
- タグを INSERT する
- SQLite unique constraint error を業務エラーへ変換する
- transport へ返す値を作る

概念的には次の形である。

```ts
export const addTag = createServerFn({ method: 'POST' })
  .validator(addTagInputSchema)
  .handler(async ({ data }) => {
    const session = await requireRequestSession()
    const db = getDB()

    const [duplicate] = await db
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(
        and(
          eq(tagsTable.userId, session.user.id),
          eq(tagsTable.normalizedName, data.name.normalized)
        )
      )
      .limit(1)

    if (duplicate != null) {
      throw new TagNameAlreadyExistsError()
    }

    try {
      const [created] = await db
        .insert(tagsTable)
        .values({
          userId: session.user.id,
          name: data.name.display,
          normalizedName: data.name.normalized
        })
        .returning({ id: tagsTable.id })

      return created
    } catch (error) {
      if (isSqliteUniqueConstraintError(error)) {
        throw new TagNameAlreadyExistsError()
      }

      throw error
    }
  })
```

この形だと、次の変更理由が同じ関数に混ざる。

- 認証方式を変える
- RPC framework を変える
- 業務エラーの型を変える
- SQL / Drizzle query を変える
- transport error を変える

Application boundary を置く目的は、これらを別々に変更できるようにすることである。

---

## 3. CreateTag の事前 SELECT を削除する

`tags` table にはすでに次の unique constraint がある。

```ts
unique().on(t.userId, t.normalizedName)
```

現在は正常系でも毎回、

```text
SELECT duplicate
INSERT tag
```

の2 query を発行する。

しかし事前 SELECT をしても、並行 request が来れば SELECT と INSERT の間に race condition がある。

最終的な正本は DB の unique constraint である。

pilot では次の形にする。

```text
INSERT tag
  ├─ success
  │    -> created
  ├─ unique violation
  │    -> name-conflict
  └─ other error
       -> throw
```

正常系の DB round trip を1回減らせる。

現在 `tags` で CreateTag が触れる値のうち、auto increment の primary key 以外の unique constraint は `(user_id, normalized_name)` である。

将来別の unique constraint を追加する場合は、`name-conflict` への変換条件を再検討する。

---

## 4. shelf tags の所有者を1つにする

現在の protected layout は `fetchShelfTags()` を呼んでいる。

```ts
// src/routes/_protected.tsx
loader: async () => {
  const shelfTagsPromise = fetchShelfTags()
  return { shelfTagsPromise }
}
```

一方 `/tags` route も同じ `fetchShelfTags()` を呼んでいる。

```ts
// src/routes/_protected/tags/index.tsx
loader: async () => {
  const { user } = await ensureSession()
  const tagsPromise = fetchShelfTags()

  return {
    user,
    tagsPromise
  }
}
```

`/tags` は protected layout 配下なので、同じ projection を親と子が別々に要求している。

TanStack Query 移行後は shelf tags を **protected layout が所有する共通 query** にする。

```text
/_protected loader
  -> shelfTagsQuery を prefetch

ShelfSidebar
  -> same query cache

MobileShelfDialog
  -> same query cache

/tags TagTable
  -> same query cache
```

CreateTag 成功後はこの query key を invalidate する。

---

## 5. 目標アーキテクチャ

Mutation / workflow は次の形を基本とする。

```mermaid
flowchart LR
  UI[React UI]
  TQ[TanStack Query]
  CLIENT[oRPC Client]
  RPC[oRPC Procedure]
  AUTH[Auth Middleware]
  UC[Application / UseCase]
  PORT[Narrow Function Port]
  INFRA[Drizzle Adapter]
  DB[(Turso)]

  UI --> TQ
  TQ --> CLIENT
  CLIENT --> RPC
  RPC --> AUTH
  AUTH --> UC
  UC --> PORT
  INFRA --> PORT
  INFRA --> DB
```

依存方向は次のようにする。

```mermaid
flowchart TD
  Transport[oRPC / TanStack Query]
  Application[Application / UseCase]
  Domain[Domain types / rules]
  Infrastructure[Drizzle / Turso]

  Transport --> Application
  Application --> Domain
  Infrastructure --> Application
  Infrastructure --> Domain
```

Application は次を知らない。

- TanStack Start
- oRPC
- HTTP status
- Cookie
- Drizzle
- `AppDb`
- Turso
- React
- TanStack Query

---

## 6. `AppDb` 直接注入と narrow port の比較

### 案A: `AppDb` を Application に直接渡す

```ts
export async function executeCreateTag(params: {
  readonly db: AppDb
  readonly actorId: UserId
  readonly command: CreateTagCommand
}): Promise<CreateTagResult> {
  // Drizzle query
}
```

#### Pros

- ファイル数が少ない
- 実装が直接的

#### Cons

- Application が Drizzle に依存する
- unit test が query builder の呼び出し方に依存する
- `insert().values().returning()` などの mock が必要になる
- DB 実装の変更で Application test まで壊れやすい

今回の主目的がテスタビリティ改善なので採用しない。

### 案B: 汎用 `TagRepository`

```ts
interface TagRepository {
  create(...): Promise<...>
  update(...): Promise<...>
  findById(...): Promise<...>
  list(...): Promise<...>
}
```

#### Pros

- Drizzle を隠せる

#### Cons

- 今使わない能力まで interface に入りやすい
- read model と write model が混ざりやすい
- fake の実装量が増える
- Repository が巨大化しやすい

採用しない。

### 案C: 必要な能力だけ function port にする

```ts
export type InsertTag = (
  input: InsertTagInput
) => Promise<InsertTagOutcome>
```

#### Pros

- Application が Drizzle を知らない
- unit test は単純な function stub だけでよい
- 依存している能力が型から読める
- generic Repository より surface が小さい

#### Cons

- port と adapter のファイルは増える
- 小さい UseCase では層が薄く見える

**案Cを採用する。**

---

## 7. CreateTag Application

`src/features/tags/application/create-tag.ts` のイメージ。

```ts
import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
import type { UserId } from '../../auth/domain/auth-values'
import type { TagId, TagName } from '../domain/tag-values'

export type CreateTagCommand = {
  readonly name: TagName
  readonly pinned?: boolean
  readonly sortOrder?: number
  readonly color?: string | null
}

export type CreateTagError = {
  readonly code: 'tag-name-already-exists'
}

export type CreatedTag = {
  readonly id: TagId
  readonly name: TagName
  readonly pinned: boolean
  readonly sortOrder: number
  readonly color: string | null
}

export type CreateTagResult = Result<CreatedTag, CreateTagError>

export type InsertTagInput = {
  readonly actorId: UserId
  readonly name: TagName
  readonly pinned: boolean
  readonly sortOrder: number
  readonly color: string | null
}

export type InsertTagOutcome =
  | { readonly kind: 'created'; readonly id: TagId }
  | { readonly kind: 'name-conflict' }

export type InsertTag = (
  input: InsertTagInput
) => Promise<InsertTagOutcome>

export async function executeCreateTag(params: {
  readonly insertTag: InsertTag
  readonly actorId: UserId
  readonly command: CreateTagCommand
}): Promise<CreateTagResult> {
  const pinned = params.command.pinned ?? false
  const sortOrder = params.command.sortOrder ?? 0
  const color = params.command.color ?? null

  const outcome = await params.insertTag({
    actorId: params.actorId,
    name: params.command.name,
    pinned,
    sortOrder,
    color
  })

  switch (outcome.kind) {
    case 'name-conflict':
      return err({ code: 'tag-name-already-exists' })

    case 'created':
      return ok({
        id: outcome.id,
        name: params.command.name,
        pinned,
        sortOrder,
        color
      })
  }
}
```

この UseCase は小さいが、少なくとも次を Application の責務として持つ。

- default 値を確定する
- persistence の conflict を業務エラーへ変換する
- transport から独立した成功値を作る

---

## 8. Drizzle adapter

`src/features/tags/infrastructure/insert-tag.server.ts` のイメージ。

```ts
import * as v from 'valibot'

import type { AppDb } from '../../../db/app-db'
import { getDB } from '../../../db/get-db.server'
import { tagsTable } from '../../../db/schema/tag'
import type { InsertTag } from '../application/create-tag'
import { tagIdSchema } from '../domain/tag-values'
import { isSqliteUniqueConstraintError } from './is-sqlite-unique-constraint-error'

export async function insertTagWithDrizzle(params: {
  readonly db: AppDb
  readonly input: Parameters<InsertTag>[0]
}): ReturnType<InsertTag> {
  try {
    const [created] = await params.db
      .insert(tagsTable)
      .values({
        userId: params.input.actorId,
        name: params.input.name.display,
        normalizedName: params.input.name.normalized,
        pinned: params.input.pinned,
        sortOrder: params.input.sortOrder,
        color: params.input.color
      })
      .returning({ id: tagsTable.id })

    if (created == null) {
      throw new Error('Tag insert returned no row')
    }

    return {
      kind: 'created',
      id: v.parse(tagIdSchema, created.id)
    }
  } catch (error) {
    if (isSqliteUniqueConstraintError(error)) {
      return { kind: 'name-conflict' }
    }

    throw error
  }
}

export const insertTag: InsertTag = (input) =>
  insertTagWithDrizzle({
    db: getDB(),
    input
  })
```

SQLite / libSQL 固有の error 判定は infrastructure に閉じ込める。

---

## 9. UseCase test は Drizzle を mock しない

```ts
import { expect, test } from 'vitest'

import type { InsertTag } from './create-tag'
import { executeCreateTag } from './create-tag'

test('未指定値を default 化する', async () => {
  let received: Parameters<InsertTag>[0] | undefined

  const insertTag: InsertTag = async (input) => {
    received = input
    return { kind: 'created', id: tagId(1) }
  }

  const result = await executeCreateTag({
    insertTag,
    actorId: userId('user-1'),
    command: {
      name: tagName('TypeScript')
    }
  })

  expect(received).toMatchObject({
    pinned: false,
    sortOrder: 0,
    color: null
  })

  expect(result).toMatchObject({
    ok: true,
    value: {
      id: 1,
      pinned: false,
      sortOrder: 0,
      color: null
    }
  })
})

test('name conflict を Expected Error へ変換する', async () => {
  const insertTag: InsertTag = async () => ({
    kind: 'name-conflict'
  })

  const result = await executeCreateTag({
    insertTag,
    actorId: userId('user-1'),
    command: {
      name: tagName('TypeScript')
    }
  })

  expect(result).toStrictEqual({
    ok: false,
    error: {
      code: 'tag-name-already-exists'
    }
  })
})
```

Application test に Drizzle fluent mock を持ち込まないことを成功条件にする。

---

## 10. Infrastructure test は DB の事実を確認する

Infrastructure test では次を確認する。

- unique constraint が実際に効く
- unique violation が `name-conflict` へ変換される
- その他の DB error は throw される

ここでは fluent API の細かい mock より、可能なら一時的な libSQL / SQLite compatible DB を使う。

Application test は速く純粋に保ち、DB adapter の correctness は integration test で確認する。

---

## 11. read projection は query service でよい

`shelfTags` は画面表示用 projection で、現時点では業務上の分岐をほとんど持たない。

これを mutation と同じ形に揃えるためだけに `ShelfTagRepository` や `ListShelfTagsUseCase` を作る価値は低い。

read-only projection は server-only query service として分離する。

```ts
export async function listShelfTags(params: {
  readonly db: AppDb
  readonly actorId: UserId
}): Promise<ShelfTag[]> {
  return params.db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      pinned: tagsTable.pinned,
      sortOrder: tagsTable.sortOrder,
      color: tagsTable.color,
      lastUsedAt: tagsTable.lastUsedAt,
      bookmarkCount: sql<number>`count(${bookmarkTable.id})`.mapWith(Number)
    })
    .from(tagsTable)
    .leftJoin(bookmarkTagsTable, eq(bookmarkTagsTable.tagId, tagsTable.id))
    .leftJoin(
      bookmarkTable,
      and(
        eq(bookmarkTable.id, bookmarkTagsTable.bookmarkId),
        isNull(bookmarkTable.deletedAt)
      )
    )
    .where(eq(tagsTable.userId, params.actorId))
    .groupBy(tagsTable.id)
}
```

非対称性は意図したものである。

```text
mutation / workflow
  -> UseCase + narrow port

simple read projection
  -> query service
```

全処理を同じ形に揃えること自体を目的にしない。

---

## 12. Error model

失敗を次の3種類に分ける。

| 種類 | 例 | 表現 | 責務 |
| --- | --- | --- | --- |
| Expected Application Error | 同名タグ、重複URL、対象なし | `Result.err` | Application |
| Boundary Rejection | 未認証、入力不正、rate limit | oRPC error | RPC boundary |
| Unexpected Error | DB障害、invariant violation、実装バグ | `throw` | oRPC まで伝播 |

### Expected Error

```ts
export type CreateTagError = {
  readonly code: 'tag-name-already-exists'
}
```

### Boundary Rejection

未認証は CreateTag という業務の失敗ではない。

UseCase が実行される前に拒否する。

### Unexpected Error

次のようにはしない。

```ts
// 採用しない
return err({ code: 'unexpected-error' })
```

未知の障害を Expected Error に潰さない。

---

## 13. Auth middleware

共通 auth middleware は actorId を context へ追加する。

```ts
import { os } from '@orpc/server'
import * as v from 'valibot'

import { userIdSchema } from '../features/auth/domain/auth-values'
import { getAuth } from '../features/auth/functions/get-auth.server'

type RpcInitialContext = {
  readonly headers: Headers
}

const base = os
  .$context<RpcInitialContext>()
  .errors({
    UNAUTHORIZED: {}
  })

const requireAuth = base.middleware(
  async ({ context, next, errors }) => {
    const session = await getAuth().api.getSession({
      headers: context.headers
    })

    if (!session) {
      throw errors.UNAUTHORIZED()
    }

    return next({
      context: {
        actorId: v.parse(userIdSchema, session.user.id)
      }
    })
  }
)

export const authed = base.use(requireAuth)
```

UseCase は Cookie や session API を知らない。

---

## 14. Unexpected Error logging は server-side interceptor で共通化する

ここは重要である。

前案では router middleware で Unexpected Error を記録する案も検討したが、oRPC の lifecycle を確認すると **server-side client interceptor の方が適切**である。

理由は次の2つ。

1. HTTP の `RPCHandler` だけに logging を置くと、SSR の `createRouterClient` が HTTP handler を通らないため取りこぼす
2. router middleware は登録位置によって input / output validation との実行順が変わる

そこで同じ interceptor を、

- browser request を受ける `RPCHandler`
- SSR direct call の `createRouterClient`

の両方へ渡す。

```ts
import { onError, ORPCError } from '@orpc/server'

export const serverInterceptors = [
  onError((error) => {
    if (error instanceof ORPCError && error.status < 500) {
      return
    }

    console.error('Unexpected RPC error', error)
  })
]
```

この interceptor は error を変換しない。

```text
validation error / 4xx
  -> log しない

UNAUTHORIZED / 401
  -> log しない

defined conflict / 409
  -> log しない

plain Error
  -> log
  -> oRPC にそのまま処理させる

output validation failure / 5xx
  -> log
```

同じ例外を repository / UseCase / procedure で重複 logging しない。

---

## 15. CreateTag procedure

```ts
import * as v from 'valibot'

import { executeCreateTag } from '../application/create-tag'
import { tagNameSchema } from '../domain/tag-values'
import { insertTag } from '../infrastructure/insert-tag.server'
import { authed } from '../../../rpc/base.server'

const createTagInputSchema = v.object({
  name: tagNameSchema,
  pinned: v.optional(v.boolean()),
  sortOrder: v.optional(v.number()),
  color: v.optional(v.nullable(v.string()))
})

export const createTagProcedure = authed
  .input(createTagInputSchema)
  .errors({
    'tag-name-already-exists': {
      status: 409
    }
  })
  .handler(async ({ input, context, errors }) => {
    const result = await executeCreateTag({
      insertTag,
      actorId: context.actorId,
      command: input
    })

    if (!result.ok) {
      switch (result.error.code) {
        case 'tag-name-already-exists':
          throw errors['tag-name-already-exists']()
      }
    }

    return {
      id: result.value.id,
      name: result.value.name.display,
      pinned: result.value.pinned,
      sortOrder: result.value.sortOrder,
      color: result.value.color
    }
  })
```

procedure は transport adapter に限定する。

SQL、Cookie 読み取り、SQLite error 判定を書かない。

---

## 16. shelfTags procedure

read query は query service を呼ぶだけにする。

```ts
export const shelfTagsProcedure = authed.handler(({ context }) =>
  listShelfTags({
    db: getDB(),
    actorId: context.actorId
  })
)
```

SQL は procedure に直接書かない。

---

## 17. Browser RPC handler

```ts
import { RPCHandler } from '@orpc/server/fetch'
import { createFileRoute } from '@tanstack/react-router'

import { router } from '../../rpc/router.server'
import { serverInterceptors } from '../../rpc/server-interceptors'

const handler = new RPCHandler(router, {
  interceptors: serverInterceptors
})

export const Route = createFileRoute('/api/rpc/$')({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        const { response } = await handler.handle(request, {
          prefix: '/api/rpc',
          context: {
            headers: request.headers
          }
        })

        return response ?? new Response('Not Found', { status: 404 })
      }
    }
  }
})
```

---

## 18. SSR は `createRouterClient` で直接呼ぶ

SSR では同じ Worker の `/api/rpc` に fetch し直さない。

```ts
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createRouterClient } from '@orpc/server'
import type { RouterClient } from '@orpc/server'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { router } from './router.server'
import { serverInterceptors } from './server-interceptors'

const getClient = createIsomorphicFn()
  .server(() =>
    createRouterClient(router, {
      context: async () => ({
        headers: getRequestHeaders()
      }),
      interceptors: serverInterceptors
    })
  )
  .client((): RouterClient<typeof router> => {
    const link = new RPCLink({
      url: `${window.location.origin}/api/rpc`
    })

    return createORPCClient(link)
  })

export const client: RouterClient<typeof router> = getClient()
```

これで HTTP と SSR direct call の両方が同じ server interceptor を使う。

```text
Browser
  -> HTTP RPCHandler
  -> serverInterceptors
  -> procedure

SSR
  -> createRouterClient
  -> serverInterceptors
  -> procedure
```

---

## 19. server code が client bundle に漏れないことを確認する

SSR 最適化では server router を参照するため、client build に server 実装が混ざらないことを確認する。

特に browser bundle に次が入っていないことを確認する。

- `drizzle-orm` の server query 実装
- `@libsql/client`
- `getDB`
- Better Auth の server 実装
- Turso credentials 関連コード

`createIsomorphicFn` の server branch と type-only import を使い、build 後に実際の bundle を確認する。

「型上は server-only」だけで判断しない。

---

## 20. TanStack Query integration

```ts
import { createTanstackQueryUtils } from '@orpc/tanstack-query'

import { client } from './client'

export const orpc = createTanstackQueryUtils(client)
```

shelf tags は共通 query options にする。

```ts
export const shelfTagsQueryOptions = orpc.tags.shelf.queryOptions({
  staleTime: 30_000
})
```

短い `staleTime` を持たせ、SSR hydration 直後の不要な refetch を避ける。

Tag mutation は明示的に invalidate するので、同一画面内の変更反映に staleTime を待つ必要はない。

---

## 21. protected loader が shelf query を所有する

```ts
export const Route = createFileRoute('/_protected')({
  // beforeLoad は省略
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(shelfTagsQueryOptions)
  },
  component: Layout
})
```

ここでは `await` しない。

現在と同様に shelf tags 取得で document 全体の SSR を block せず、Suspense boundary から stream できる形を維持する。

`/tags` 子 route からは同じ shelf fetch を削除する。

---

## 22. Promise prop を Query cache へ置き換える

現在の `shelfTagsPromise` の prop drilling を減らす。

```tsx
function ShelfNavQuery(props: ShelfNavQueryProps) {
  const { data: tags } = useSuspenseQuery(shelfTagsQueryOptions)

  return (
    <ShelfNav
      tags={tags}
      selection={props.selection}
      listSearch={props.listSearch}
      onNavigate={props.onNavigate}
    />
  )
}
```

タグ管理画面も同じ query を読む。

```tsx
function TagTableQuery() {
  const { data: tags } = useSuspenseQuery(shelfTagsQueryOptions)

  return <TagTable tags={tags} />
}
```

`TagTable` は pure component にできる。

```tsx
export function TagTable({ tags }: { readonly tags: readonly ShelfTag[] }) {
  const sorted = sortTagsForNav([...tags])

  // render
}
```

---

## 23. CreateTag mutation

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { orpc } from '../../../rpc/query-utils'

export function useCreateTagMutation() {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.tags.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.tags.shelf.key()
        })
      }
    })
  )
}
```

pilot では invalidation 完了を待つ。

理由は、新規タグ作成直後に sidebar とタグ一覧へ反映される UX を維持するためである。

この再取得が latency 上問題になる場合は `setQueryData` を次の最適化候補にする。

最初から optimistic cache update を入れて複雑性を増やさない。

---

## 24. UI は Error class name を見ない

現在の判定例。

```ts
if (
  error instanceof Error &&
  error.name === 'TagNameAlreadyExistsError'
) {
  return 'そのタグ名は既に存在します'
}
```

移行後。

```ts
import { isDefinedError } from '@orpc/client'

export function getCreateTagErrorMessage(error: unknown): string {
  if (
    isDefinedError(error) &&
    error.code === 'tag-name-already-exists'
  ) {
    return 'そのタグ名は既に存在します'
  }

  return 'タグの作成に失敗しました'
}
```

`new-tag-screen.tsx` と `inline-add-tag.tsx` は同じ helper を使う。

`edit-tag-form.tsx` は UpdateTag 移行時に変更する。

---

## 25. 認証コストについて

`/_protected` の route guard と RPC auth middleware は役割が違う。

- route guard: 未認証ユーザーを sign-in へ redirect する
- RPC auth: data operation 自体を保護する

そのため oRPC 導入後も、route guard があるから RPC auth を省略してはいけない。

ブラウザから `actorId` を渡して auth を省略する案も採用しない。

一方で SSR では同一 request 内で session lookup が複数回起きる可能性がある。

これは pilot で計測する。

もし Better Auth の session lookup が無視できないコストなら、次の順で検討する。

1. request-scoped session memoization
2. 同一 request 内 middleware の dedupe
3. query のまとめ方の見直し

セキュリティ境界を弱めて最適化しない。

---

## 26. テスト戦略

### Application unit test

確認する。

- default 値
- Expected Error mapping
- business flow

依存しないもの。

- TanStack Start
- oRPC
- Drizzle
- Turso
- Cloudflare Workers runtime

### Infrastructure integration test

確認する。

- SQL / Drizzle query
- unique constraint
- error classification

### RPC integration test

最低限次を確認する。

```text
invalid input
  -> 4xx validation error

unauthenticated
  -> UNAUTHORIZED / 401

duplicate tag name
  -> tag-name-already-exists / 409

unknown Error
  -> INTERNAL_SERVER_ERROR / 500

unknown Error detail
  -> client へ漏れない
```

さらに、

- HTTP `RPCHandler`
- SSR `createRouterClient`

の両方で auth と server interceptor が動くことを確認する。

### Query / UI test

確認する。

- protected loader が shelf query を prefetch する
- `/tags` が重複 fetch を持たない
- sidebar / mobile / tag table が同じ query key を使う
- CreateTag 成功後に shelf query が invalidate される
- duplicate error のメッセージを維持する
- 500 系 error を duplicate と誤表示しない

---

## 27. パフォーマンス上の期待値

### CreateTag DB query

現在:

```text
SELECT duplicate
+ INSERT
```

移行後:

```text
INSERT
```

正常系 DB round trip を1回削減する。

### shelf tags

現在は親 route と子 route が同じ projection を要求している。

移行後は protected layout の1 query を全 consumer が共有する。

### SSR

`createRouterClient` で Worker 内部 HTTP を避ける。

### hydration

短い `staleTime` で hydration 直後の不要な refetch を避ける。

### logging

Unexpected Error を1回だけ記録する。

### client bundle

server router / Drizzle / Turso driver が browser bundle に入らないことを確認する。

---

## 28. ディレクトリ構成案

```text
src/
  rpc/
    base.server.ts
    router.server.ts
    server-interceptors.ts
    client.ts
    query-utils.ts

  features/
    tags/
      application/
        create-tag.ts
        create-tag.test.ts

      domain/
        tag-values.ts

      infrastructure/
        insert-tag.server.ts
        insert-tag.test.ts
        is-sqlite-unique-constraint-error.ts
        list-shelf-tags.server.ts

      rpc/
        create-tag.ts
        shelf-tags.ts

      queries/
        shelf-tags-query.ts
        use-create-tag-mutation.ts

      components/
        ...

  routes/
    api/
      rpc.$.ts
```

feature locality は維持し、共通 RPC 基盤だけ `src/rpc/` に置く。

---

## 29. CreateTag pilot の移行手順

1. oRPC server / client 基盤を追加する
2. auth middleware を追加する
3. 共通 `serverInterceptors` を追加する
4. browser `RPCHandler` に interceptor を設定する
5. SSR `createRouterClient` に同じ interceptor を設定する
6. `InsertTag` narrow port を定義する
7. `executeCreateTag` を追加する
8. Drizzle adapter `insertTag` を追加する
9. CreateTag の事前 duplicate SELECT を廃止する
10. CreateTag procedure を追加する
11. `shelfTags` query service / procedure を追加する
12. protected layout で shelf query を prefetch する
13. `/tags` 側の重複 fetch を削除する
14. Promise prop を `useSuspenseQuery` へ置き換える
15. CreateTag mutation hook を追加する
16. 成功後に shelf query を invalidate する
17. `new-tag-screen.tsx` を新 mutation へ移す
18. `inline-add-tag.tsx` を新 mutation へ移す
19. `Error.name` 判定を typed `code` 判定へ変更する
20. Application / Infrastructure / RPC / UI test を追加する
21. client bundle に server code が入っていないことを確認する
22. bundle size / latency / cold start / auth cost を比較する
23. 旧 `addTag` Server Function を削除する

---

## 30. Definition of Done

CreateTag pilot は次をすべて満たして完了とする。

- Application が TanStack Start に依存しない
- Application が oRPC に依存しない
- Application が Drizzle / `AppDb` に依存しない
- Application unit test に Drizzle fluent mock がない
- 既存 `Result` を再利用している
- CreateTag の Expected Error は `tag-name-already-exists` のみ
- duplicate check の事前 SELECT がない
- unique constraint race が正しく conflict になる
- 未認証が 401 になる
- duplicate が 409 になる
- unknown error が 500 になる
- unknown error の詳細が client へ漏れない
- validation 4xx を Unexpected Error として logging しない
- HTTP RPC と SSR direct call が同じ Unexpected Error logging 規約を使う
- `/tags` で shelf query を親子が二重取得しない
- CreateTag 後に sidebar / table が更新される
- UI が Error class name に依存しない
- browser bundle に Drizzle / Turso server code が混ざっていない
- client bundle / Worker bundle の増分を確認している
- cold start / request latency に目立つ悪化がない
- session lookup の回数とコストを確認している

---

## 31. Port を追加する基準

Port は「Clean Architecture だから」では追加しない。

次のどれかを満たす場合に追加する。

1. Application test で infrastructure mock が複雑になっている
2. 同じ外部能力を複数 UseCase が使う
3. infrastructure error を業務上の意味へ変換する必要がある
4. transaction 内で複数の外部操作を協調させたい
5. implementation detail が Application の型へ漏れている

単純な read projection のように Application logic がない場合は、無理に port を作らない。

---

## 32. Hono を今は導入しない

oRPC + Hono の組み合わせ自体には問題がない。

今回必要なのは、

- typed RPC
- auth middleware
- typed error contract
- server-side interceptor
- TanStack Query integration

であり、oRPC + TanStack Start で満たせる。

Hono を追加すると request lifecycle と middleware の配置候補が増える。

次の要件が出たら再評価する。

- RPC 以外の HTTP endpoint が多数増える
- webhook / callback / streaming response を共通 router で扱いたい
- oRPC adapter だけでは routing 要件が不足する
- API surface を TanStack Start から独立させたい

現段階では導入しない。

---

## 33. Pros / Cons

### Pros

- Application test が Drizzle から独立する
- transport / application / infrastructure の変更理由を分けられる
- Expected Error が型で読める
- auth failure を 500 と誤分類しにくい
- UI が Error class serialization に依存しない
- CreateTag の DB round trip を減らせる
- shelf query の ownership が明確になる
- SSR 内部 HTTP を避けられる
- HTTP / SSR の Unexpected Error logging を同じ規約にできる
- read projection に不要な abstraction を増やさない

### Cons

- ファイル数は増える
- narrow port という概念が増える
- CreateTag 単体では UseCase が薄く見える
- `Result` と oRPC defined error の2段階を理解する必要がある
- mutation と read query の構造が完全対称ではない
- migration 中は Server Function と oRPC が共存する

このコストを許容するのは、テスト容易性と責務境界が実際に改善する場合だけである。

---

## 34. 最終判断

Mutation / workflow は次の構成を採用する。

```text
React UI
  -> TanStack Query
  -> oRPC
  -> auth middleware
  -> Application UseCase
  -> narrow function port
  -> Drizzle adapter
  -> Turso
```

単純な read projection は次でよい。

```text
React UI
  -> TanStack Query
  -> oRPC
  -> auth middleware
  -> server-side query service
  -> Drizzle
  -> Turso
```

Unexpected Error の観測は procedure の内側へ混ぜない。

```text
Browser RPCHandler ------┐
                         ├-> shared server-side interceptor -> procedure
SSR createRouterClient --┘
```

Pantry では、レイヤーを揃えること自体を目的にしない。

**変更理由を分離できるか、テストが簡単になるか、性能を悪化させないか**で境界を決める。

CreateTag pilot では特に次を実証する。

1. narrow port で UseCase test を Drizzle から独立できる
2. unique constraint を正本にして正常系 query を1回減らせる
3. TanStack Query で shelf query の ownership と invalidation を整理できる
4. SSR server-side client で Worker 内部 HTTP を避けられる
5. HTTP と SSR で同じ error observability を成立させられる

これらに実益がなければ、アーキテクチャを増やしたこと自体を成果とはみなさない。

## 参考

- oRPC TanStack Start Adapter: https://orpc.dev/docs/adapters/tanstack-start
- oRPC Server-Side Clients: https://orpc.dev/docs/client/server-side
- oRPC Error Handling: https://orpc.dev/docs/error-handling
- oRPC TanStack Query Integration: https://orpc.dev/docs/integrations/tanstack-query
- TanStack Router + Query Integration: https://tanstack.com/router/latest/docs/integrations/query
