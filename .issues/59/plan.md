# タグ新規登録画面実装 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ブックマーク新規登録画面と同じ構成でタグ新規登録画面を実装し、作成後はタグ詳細画面へ遷移する。

**Architecture:** `features/tags/tag.function.ts` に `addTag` server function を追加し、`tags/new.tsx` を `@formisch/react` + `@base-ui/react` + `valibot` + `useActionState` で書き直す。作成成功後は新規作成する `tags/$id/index.tsx` へ遷移し、登録完了メッセージを表示する。タグの ID は auto-increment の整数なので、Drizzle の `returning` で生成された ID を取得する。

**Tech Stack:** TanStack Start, Hono (server function), @formisch/react, @base-ui/react, valibot, drizzle-orm

---

## File Structure

- **Modify:** `src/features/tags/tag.function.ts` — `addTag` server function を追加
- **Modify:** `src/routes/_protected/tags/new.tsx` — フォームをブックマーク新規登録画面と同じ構成に書き直し
- **Create:** `src/routes/_protected/tags/$id/index.tsx` — タグ詳細画面（ブックマーク詳細画面と同じ最小構成）
- **Modify:** `src/router.tsx` — `HistoryState` に `newTagCreated` を追加
- **Auto-generated:** `src/routeTree.gen.ts`

---

### Task 1: `addTag` server function を追加

**Files:**

- Modify: `src/features/tags/tag.function.ts`

- [ ] **Step 1: `addTag` を追加**

```typescript
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import * as v from 'valibot'

import { getDB } from '../../db/index.server'
import { tagsTable, tagInsertSchema } from '../../db/schema/tag'
import { offsetPaginationQuerySchema } from '../../schemas/pagination'
import { ensureSession } from '../auth/auth.function'

const addTagInputSchema = v.pick(tagInsertSchema, ['name'])

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

- [ ] **Step 2: 型エラーがないことを確認**

Run: `pnpm run typecheck`
Expected: PASS

---

### Task 2: タグ新規登録フォームを書き直す

**Files:**

- Modify: `src/routes/_protected/tags/new.tsx`

- [ ] **Step 1: ファイル全体をブックマーク新規登録画面と同じ構成に置き換える**

```tsx
import { Input } from '@base-ui/react'
import { Field, getInput, useForm } from '@formisch/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useActionState } from 'react'
import * as v from 'valibot'

import { addTag } from '../../../features/tags/tag.function'

export const Route = createFileRoute('/_protected/tags/new')({
  component: RouteComponent
})

function RouteComponent() {
  const navigate = useNavigate()

  async function submitAction({ name }: { name: string }) {
    const { id } = await addTag({ data: { name } })

    await navigate({
      to: '/tags/$id',
      params: { id: String(id) },
      state: { newTagCreated: true }
    })
  }

  return (
    <div>
      <h1>タグ新規作成</h1>

      <RegisterNewTagForm submitAction={submitAction} />

      <Link
        to='/tags'
        search={{ limit: 50, offset: 0 }}>
        一覧へ戻る
      </Link>
    </div>
  )
}

interface RegisterNewTagFormProps {
  submitAction: ({ name }: { name: string }) => Promise<void>
}

function RegisterNewTagForm({ submitAction }: RegisterNewTagFormProps) {
  const registerNewTagFormSchema = v.object({
    name: v.string()
  })

  const registerNewTagForm = useForm({
    initialInput: {
      name: ''
    },
    schema: registerNewTagFormSchema
  })

  const [_, throwError, isPending] = useActionState(async () => {
    const currentRawName = getInput(registerNewTagForm, { path: ['name'] }) ?? ''

    await submitAction({ name: currentRawName })
  }, null)

  return (
    <form action={throwError}>
      <fieldset>
        <legend>タグ新規登録</legend>

        <Field
          of={registerNewTagForm}
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
        {isPending ? '登録中...' : '登録'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: 型エラーがないことを確認**

Run: `pnpm run typecheck`
Expected: PASS

---

### Task 3: タグ詳細画面を作成

**Files:**

- Create: `src/routes/_protected/tags/$id/index.tsx`

- [ ] **Step 1: ブックマーク詳細画面と同じ構成でファイルを作成**

```tsx
import { createFileRoute, Link, useRouterState } from '@tanstack/react-router'
import * as v from 'valibot'

const tagDetailSearchSchema = v.object({
  created: v.optional(v.boolean())
})

export const Route = createFileRoute('/_protected/tags/$id/')({
  validateSearch: tagDetailSearchSchema,
  component: RouteComponent
})

function RouteComponent() {
  const { id } = Route.useParams()

  const { newTagCreated } = useRouterState({
    select: (s) => s.location.state
  })

  return (
    <div>
      {newTagCreated && <div role='alert'>タグを登録しました</div>}

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

- [ ] **Step 2: 型エラーがないことを確認**

Run: `pnpm run typecheck`
Expected: PASS

---

### Task 4: ルーター履歴状態の型を拡張

**Files:**

- Modify: `src/router.tsx`

- [ ] **Step 1: `HistoryState` に `newTagCreated` を追加**

```typescript
interface HistoryState {
  newBookmarkCreated?: boolean
  newTagCreated?: boolean
}
```

既存の `newBookmarkCreated` は必須から任意に変更し、新規 `newTagCreated` も任意にする。

- [ ] **Step 2: 型エラーがないことを確認**

Run: `pnpm run typecheck`
Expected: PASS

---

### Task 5: ルート生成と品質チェック

**Files:**

- Auto-generated: `src/routeTree.gen.ts`

- [ ] **Step 1: TanStack Router のルート定義を再生成**

Run: `pnpm run build`
Expected: BUILD SUCCESS

- [ ] **Step 2: Lint / Format / Typecheck / Test を実行**

Run:

```bash
pnpm run lint
pnpm run format:check
pnpm run typecheck
pnpm run test
```

Expected: すべて PASS（lint は既存の warning が残るが error は 0）

---

### Task 6: 動作確認

**Files:**

- ブラウザ / Playwright

- [ ] **Step 1: 開発サーバーを起動**

Run: `pnpm run dev`

- [ ] **Step 2: `/tags/new` にアクセスし、タグ名を入力して登録**

Expected:

- タグ詳細画面（`/tags/$id`）へ遷移する
- 「タグを登録しました」のメッセージが表示される

---

### Task 7: コミット

- [ ] **Step 1: 変更をステージしてコミット**

```bash
git add src/features/tags/tag.function.ts src/routes/_protected/tags/new.tsx src/routes/_protected/tags/\$id/index.tsx src/router.tsx src/routeTree.gen.ts
git commit -m "feat: implement tag creation form and addTag server function (#59)"
```

---

## Self-Review

- **Spec coverage:** タグ新規登録フォーム（Task 2）、server function（Task 1）、詳細画面（Task 3）、履歴状態の型拡張（Task 4）、品質チェック（Task 5）、動作確認（Task 6）すべて網羅済み。
- **Placeholder scan:** TBD / TODO / "implement later" なし。各ステップに実際のコードとコマンドを記載。
- **Type consistency:** `addTag` は `{ id: number }` を返却し、`navigate` 時に `String(id)` で文字列に変換して `params` に渡す。タグの ID は auto-increment 整数。
