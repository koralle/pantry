# タグ編集画面実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存のタグ名を取得・更新できる編集画面（`/_protected/tags/$id/edit`）を完成させ、入力検証と重複チェック、更新後のフラッシュ表示まで実装する。

**Architecture:** 既存のタグ新規作成画面（`tags/new.tsx`）と同じ `@formisch/react` + `@base-ui/react` + `createServerFn` のパターンを流用する。タグ名の正規化・検証ロジックは `addTag` / `updateTag` で共通化し、DB 更新前に同一ユーザー内での重複をアプリケーション側で検知してユーザーに伝える。更新後はタグ詳細画面へ遷移し、更新成功をフラッシュ表示する。

**Tech Stack:** TanStack Start / React Router, Hono/Better Auth（セッション確認）, Drizzle ORM + D1, Valibot, @formisch/react, @base-ui/react, Vitest

---

## File Structure

| File                                        | Responsibility                                                      |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `src/features/tags/tag-name.schema.ts`      | タグ名の共通スキーマ（trim + lowercase + 空文字禁止 + 32 文字制限） |
| `src/features/tags/tag.function.ts`         | `fetchTags` / `addTag` / `getTag` / `updateTag` のサーバー関数      |
| `src/routes/_protected/tags/$id.edit.tsx`   | タグ編集画面（loader + form + 更新後遷移）                          |
| `src/routes/_protected/tags/$id/index.tsx`  | タグ詳細画面の「更新しました」フラッシュ表示                        |
| `src/router.tsx`                            | `HistoryState` に `tagUpdated` を追加                               |
| `src/features/tags/tag-name.schema.test.ts` | タグ名スキーマの単体テスト                                          |

---

## Task 1: タグ名の共通バリデーションスキーマを作成

**Files:**

- Create: `src/features/tags/tag-name.schema.ts`
- Test: `src/features/tags/tag-name.schema.test.ts`（Task 7 で作成）

- [ ] **Step 1: スキーマファイルを作成**

```ts
import * as v from 'valibot'

export const tagNameSchema = v.pipe(
  v.string('タグ名を入力してください'),
  v.transform((value) => value.trim().toLowerCase()),
  v.nonEmpty('タグ名を入力してください'),
  v.maxLength(32, 'タグ名は32文字以内で入力してください')
)

export type TagName = v.InferOutput<typeof tagNameSchema>
```

- [ ] **Step 2: 型チェックを実行**

Run: `pnpm run typecheck`
Expected: 成功（`src/features/tags/tag-name.schema.ts` に型エラーがない）

- [ ] **Step 3: Commit**

```bash
git add src/features/tags/tag-name.schema.ts
git commit -m "feat(tags): add shared tag name validation schema"
```

---

## Task 2: `addTag` を共通スキーマで検証するよう修正

**Files:**

- Modify: `src/features/tags/tag.function.ts`

`addTag` も `tagNameSchema` を使うようにし、タグ作成・更新で同じ正規化・制約が適用されるようにする。

- [ ] **Step 1: 既存の `addTagInputSchema` を置き換え**

変更前:

```ts
const addTagInputSchema = v.pick(tagInsertSchema, ['name'])
```

変更後:

```ts
import { tagNameSchema } from './tag-name.schema'

const addTagInputSchema = v.object({
  name: tagNameSchema
})
```

`src/features/tags/tag.function.ts` の `addTag` 部分は以下のようになる:

```ts
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import * as v from 'valibot'

import { getDB } from '../../db/index.server'
import { tagsTable } from '../../db/schema/tag'
import { offsetPaginationQuerySchema } from '../../schemas/pagination'
import { ensureSession } from '../auth/auth.function'
import { tagNameSchema } from './tag-name.schema'

const addTagInputSchema = v.object({
  name: tagNameSchema
})

export const fetchTags = createServerFn({ method: 'GET' })
  .validator(offsetPaginationQuerySchema)
  .handler(async (ctx) => {
    const session = await ensureSession()

    const { limit, offset } = ctx.data

    const db = getDB()

    return db
      .select()
      .from(tagsTable)
      .where(eq(tagsTable.userId, session.user.id))
      .limit(limit)
      .offset(offset)
  })

export const addTag = createServerFn({ method: 'POST' })
  .validator(addTagInputSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const { name } = ctx.data

    const result = await db
      .insert(tagsTable)
      .values({ name, userId: session.user.id })
      .returning({ id: tagsTable.id })

    const [first] = result

    if (first == null) {
      throw new Error('Failed to insert tag')
    }

    return { id: first.id }
  })
```

- [ ] **Step 2: 型チェックを実行**

Run: `pnpm run typecheck`
Expected: 成功

- [ ] **Step 3: Commit**

```bash
git add src/features/tags/tag.function.ts
git commit -m "feat(tags): normalize and validate addTag input with shared schema"
```

---

## Task 3: `getTag` サーバー関数を追加

**Files:**

- Modify: `src/features/tags/tag.function.ts`

- [ ] **Step 1: `getTag` を `addTag` の直後に追加**

追加コード:

```ts
import { and, eq } from 'drizzle-orm'

const tagIdSchema = v.object({
  id: v.number()
})

export const getTag = createServerFn({ method: 'GET' })
  .validator(tagIdSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const [tag] = await db
      .select()
      .from(tagsTable)
      .where(and(eq(tagsTable.id, ctx.data.id), eq(tagsTable.userId, session.user.id)))
      .limit(1)

    if (tag == null) {
      throw new Error('Tag not found')
    }

    return tag
  })
```

`and` を `drizzle-orm` から import する行を確認:

```ts
import { and, eq } from 'drizzle-orm'
```

- [ ] **Step 2: 型チェックを実行**

Run: `pnpm run typecheck`
Expected: 成功

- [ ] **Step 3: Commit**

```bash
git add src/features/tags/tag.function.ts
git commit -m "feat(tags): add getTag server function"
```

---

## Task 4: `updateTag` サーバー関数を追加

**Files:**

- Modify: `src/features/tags/tag.function.ts`

- [ ] **Step 1: `updateTag` を `getTag` の直後に追加**

追加コード:

```ts
import { and, eq, ne, sql } from 'drizzle-orm'

const updateTagInputSchema = v.object({
  id: v.number(),
  name: tagNameSchema
})

export const updateTag = createServerFn({ method: 'POST' })
  .validator(updateTagInputSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const { id, name } = ctx.data

    const [duplicate] = await db
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(
        and(eq(tagsTable.name, name), eq(tagsTable.userId, session.user.id), ne(tagsTable.id, id))
      )
      .limit(1)

    if (duplicate != null) {
      throw new Error('Tag name already exists')
    }

    const [updated] = await db
      .update(tagsTable)
      .set({
        name,
        updatedAt: sql`(cast(unixepoch('subsecond') * 1000 as integer))`
      })
      .where(and(eq(tagsTable.id, id), eq(tagsTable.userId, session.user.id)))
      .returning({ id: tagsTable.id })

    if (updated == null) {
      throw new Error('Tag not found')
    }

    return { id: updated.id }
  })
```

`drizzle-orm` の import を以下に更新:

```ts
import { and, eq, ne, sql } from 'drizzle-orm'
```

- [ ] **Step 2: 型チェックを実行**

Run: `pnpm run typecheck`
Expected: 成功

- [ ] **Step 3: Commit**

```bash
git add src/features/tags/tag.function.ts
git commit -m "feat(tags): add updateTag server function with duplicate check"
```

---

## Task 5: タグ編集画面を実装

**Files:**

- Modify: `src/routes/_protected/tags/$id.edit.tsx`

- [ ] **Step 1: ルートファイルを全面的に書き換え**

```tsx
import { Input } from '@base-ui/react'
import { Field, getInput, useForm } from '@formisch/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { use, useActionState } from 'react'
import * as v from 'valibot'

import { getTag, updateTag } from '../../../features/tags/tag.function'

const tagIdParamSchema = v.pipe(v.string(), v.transform(Number), v.integer('Invalid tag id'))

export const Route = createFileRoute('/_protected/tags/$id/edit')({
  loader: async ({ params }) => {
    const id = v.parse(tagIdParamSchema, params.id)
    const tagPromise = getTag({ data: { id } })

    return {
      tagPromise
    }
  },
  component: RouteComponent
})

function RouteComponent() {
  const { tagPromise } = Route.useLoaderData()
  const navigate = useNavigate()

  async function submitAction({ id, name }: { id: number; name: string }) {
    const { id: updatedId } = await updateTag({ data: { id, name } })

    await navigate({
      to: '/tags/$id',
      params: { id: String(updatedId) },
      state: { tagUpdated: true }
    })
  }

  return (
    <div>
      <h1>タグ編集</h1>

      <EditTagForm
        tagPromise={tagPromise}
        submitAction={submitAction}
      />

      <Link
        to='/tags'
        search={{ limit: 50, offset: 0 }}>
        一覧へ戻る
      </Link>
    </div>
  )
}

interface EditTagFormProps {
  readonly tagPromise: Promise<{ id: number; name: string }>
  readonly submitAction: (input: { id: number; name: string }) => Promise<void>
}

function EditTagForm({ tagPromise, submitAction }: EditTagFormProps) {
  const tag = use(tagPromise)

  const editTagFormSchema = v.object({
    name: v.string()
  })

  const editTagForm = useForm({
    initialInput: {
      name: tag.name
    },
    schema: editTagFormSchema
  })

  const [_, throwError, isPending] = useActionState(async () => {
    const currentRawName = getInput(editTagForm, { path: ['name'] }) ?? ''

    await submitAction({ id: tag.id, name: currentRawName })
  }, null)

  return (
    <form action={throwError}>
      <fieldset>
        <legend>タグ編集</legend>

        <Field
          of={editTagForm}
          path={['name']}>
          {(field) => (
            <label htmlFor={field.props.name}>
              タグ名
              <Input
                id={field.props.name}
                value={field.input}
                type='text'
                onValueChange={(newValue) => {
                  field.onChange(newValue)
                }}
                required
              />
            </label>
          )}
        </Field>
      </fieldset>

      <button
        type='submit'
        disabled={isPending}>
        {isPending ? '更新中...' : '更新'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: 型チェックを実行**

Run: `pnpm run typecheck`
Expected: 成功

- [ ] **Step 3: Commit**

```bash
git add src/routes/_protected/tags/\$id.edit.tsx
git commit -m "feat(tags): implement tag edit screen with loader and form"
```

---

## Task 6: タグ詳細画面に更新成功フラッシュを追加

**Files:**

- Modify: `src/routes/_protected/tags/$id/index.tsx`
- Modify: `src/router.tsx`

- [ ] **Step 1: `router.tsx` の `HistoryState` に `tagUpdated` を追加**

変更前:

```ts
interface HistoryState {
  newBookmarkCreated?: boolean
  newTagCreated?: boolean
}
```

変更後:

```ts
interface HistoryState {
  newBookmarkCreated?: boolean
  newTagCreated?: boolean
  tagUpdated?: boolean
}
```

- [ ] **Step 2: タグ詳細画面で `tagUpdated` を読み取ってフラッシュ表示**

変更前:

```tsx
const { newTagCreated } = useRouterState({
  select: (s) => s.location.state
})
```

変更後:

```tsx
const { newTagCreated, tagUpdated } = useRouterState({
  select: (s) => s.location.state
})
```

そして新規登録フラッシュの下に更新フラッシュを追加:

```tsx
{
  tagUpdated && <div role='alert'>タグを更新しました</div>
}
```

`src/routes/_protected/tags/$id/index.tsx` の該当部分:

```tsx
function RouteComponent() {
  const { id } = Route.useParams()

  const { newTagCreated, tagUpdated } = useRouterState({
    select: (s) => s.location.state
  })

  return (
    <div>
      {newTagCreated && <div role='alert'>タグを登録しました</div>}
      {tagUpdated && <div role='alert'>タグを更新しました</div>}

      <h1>タグ詳細</h1>

      <p>ID: {id}</p>

      <nav>
        <Link
          to='/tags/$id/edit'
          params={{ id }}>
          編集
        </Link>

        <Link
          to='/tags'
          search={{ limit: 50, offset: 0 }}>
          一覧へ戻る
        </Link>
      </nav>
    </div>
  )
}
```

- [ ] **Step 3: 型チェックを実行**

Run: `pnpm run typecheck`
Expected: 成功

- [ ] **Step 4: Commit**

```bash
git add src/routes/_protected/tags/\$id/index.tsx src/router.tsx
git commit -m "feat(tags): show updated flash on tag detail after edit"
```

---

## Task 7: タグ名スキーマの単体テストを追加

**Files:**

- Create: `src/features/tags/tag-name.schema.test.ts`

- [ ] **Step 1: テストファイルを作成**

```ts
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { tagNameSchema } from './tag-name.schema'

describe('tagNameSchema', () => {
  test('trims and lowercases the input', () => {
    const result = v.parse(tagNameSchema, '  TypeScript  ')
    expect(result).toBe('typescript')
  })

  test('accepts a 32-character name', () => {
    const name = 'a'.repeat(32)
    const result = v.parse(tagNameSchema, name)
    expect(result).toBe(name)
  })

  test('rejects an empty string after trimming', () => {
    expect(() => v.parse(tagNameSchema, '   ')).toThrow()
  })

  test('rejects a name longer than 32 characters', () => {
    expect(() => v.parse(tagNameSchema, 'a'.repeat(33))).toThrow()
  })
})
```

- [ ] **Step 2: テストを実行**

Run: `pnpm run test -- src/features/tags/tag-name.schema.test.ts`
Expected: 全テスト PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/tags/tag-name.schema.test.ts
git commit -m "test(tags): add unit tests for tag name schema"
```

---

## Task 8: 品質ゲートを実行

- [ ] **Step 1: 型チェック**

Run: `pnpm run typecheck`
Expected: 成功

- [ ] **Step 2: Linter**

Run: `pnpm run lint`
Expected: 成功

- [ ] **Step 3: Formatter check**

Run: `pnpm run format:check`
Expected: 成功

- [ ] **Step 4: 全テスト**

Run: `pnpm run test`
Expected: 全テスト PASS

- [ ] **Step 5: 手動確認（開発サーバー）**

Run: `pnpm run dev`
手動で以下を確認:

1. `/tags` から既存タグの詳細 `/tags/$id` へ遷移
2. 「編集」リンクから `/tags/$id/edit` を開く
3. タグ名を変更して「更新」を押すと `/tags/$id` へ遷移し「タグを更新しました」が表示される
4. 同名タグ（trim/lowercase 後）に変更するとエラーが表示される
5. 33 文字以上・空文字では更新ボタン押下時にサーバー側でエラーになる

- [ ] **Step 6: Commit（修正があれば）**

```bash
git add -A
git commit -m "chore: apply formatter/linter fixes for tag edit screen"
```

---

## Spec Coverage

Issue #62「タグ編集画面を作る」の要件と対応タスク:

| 要件                                                              | 実装タスク                                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 既存タグを読み込んで編集フォームを表示                            | Task 3 (`getTag`), Task 5 (loader + form の初期値)                            |
| タグ名を更新できる                                                | Task 4 (`updateTag`), Task 5 (form submit)                                    |
| タグ名の正規化・制約（trim + lowercase、空文字禁止、32 文字制限） | Task 1 (`tagNameSchema`), Task 2 (`addTag` 共通化), Task 4 (`updateTag` 検証) |
| 同一ユーザー内での重複防止                                        | Task 4 (`updateTag` の重複チェック)                                           |
| 更新後のフィードバック                                            | Task 6 (詳細画面フラッシュ)                                                   |
| 品質担保                                                          | Task 7 (単体テスト), Task 8 (品質ゲート)                                      |

---

## 注意点・制約

- タグ ID は現行実装で `integer` 自動採番であるため、本計画もその型に合わせている。将来的に UUID v7 移行が決まった場合は `tagIdParamSchema` 等も追随する。
- `tagUpdated` フラッシュは `HistoryState` を経由して渡している。ブラウザリロード時はフラッシュは表示されない（意図通り）。
- 重複チェックはアプリケーション側で行い、DB ユニーク制約違反が発生する前にユーザーにメッセージを返す。ただし万が一制約違反が発生しても、共通エラーハンドラで処理される。
