# ブックマーク編集画面実装 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存ブックマークの URL・タイトル・メモを編集し、保存後に詳細画面へ遷移する編集画面を実装する。

**Architecture:** `features/bookmarks/bookmark.function.ts` に `getBookmark`（単体取得・所有者判定）と `updateBookmark`（更新・URL 重複検知）の server function を追加する。編集画面 `routes/_protected/bookmarks/$id/edit.tsx` は `@formisch/react` + `@base-ui/react` + `valibot` + `useActionState` でブックマーク新規登録画面と同じ構成を保ち、loader で既存データを取得してフォームにプリフィルする。更新成功後は詳細画面へ `bookmarkUpdated` 状態を持って遷移し、完了メッセージを表示する。

**Tech Stack:** TanStack Start, Hono（server function）, @formisch/react, @base-ui/react, valibot, drizzle-orm

---

## File Structure

- **Modify:** `src/features/bookmarks/bookmark.function.ts` — `getBookmark` / `updateBookmark` server function と入力スキーマを追加
- **Modify:** `src/routes/_protected/bookmarks/$id/edit.tsx` — 編集フォーム・ローダーを実装
- **Modify:** `src/routes/_protected/bookmarks/$id/index.tsx` — 更新完了メッセージを表示
- **Modify:** `src/router.tsx` — `HistoryState` に `bookmarkUpdated` を追加
- **Create:** `src/features/bookmarks/bookmark.function.test.ts` — 更新入力スキーマの単体テスト
- **Auto-generated:** `src/routeTree.gen.ts`

---

### Task 1: `getBookmark` / `updateBookmark` server function を追加

**Files:**

- Modify: `src/features/bookmarks/bookmark.function.ts`

- [ ] **Step 1: `and` の import と更新入力スキーマを追加**

```typescript
import { and, eq } from 'drizzle-orm'
```

- [ ] **Step 2: ファイル全体を以下のように置き換える**

```typescript
import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import * as v from 'valibot'

import { getDB } from '../../db/index.server'
import { bookmarkTable, bookmarkInsertSchema } from '../../db/schema/bookmark'
import { offsetPaginationQuerySchema } from '../../schemas/pagination'
import { ensureSession } from '../auth/auth.function'

const addBookmarkInputSchema = v.pick(bookmarkInsertSchema, ['url', 'title', 'note'])

export const updateBookmarkInputSchema = v.object({
  id: v.string(),
  url: v.pipe(v.string(), v.url()),
  title: v.string(),
  note: v.nullable(v.string())
})

export const fetchBookmarks = createServerFn({ method: 'GET' })
  .validator(offsetPaginationQuerySchema)
  .handler(async (ctx) => {
    const session = await ensureSession()

    const { limit, offset } = ctx.data

    const db = getDB()

    return db
      .select()
      .from(bookmarkTable)
      .where(eq(bookmarkTable.userId, session.user.id))
      .limit(limit)
      .offset(offset)
  })

export const addBookmark = createServerFn({ method: 'POST' })
  .validator(addBookmarkInputSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const id = uuidv7()
    const { url, title, note } = ctx.data

    await db.insert(bookmarkTable).values({ id, url, title, note, userId: session.user.id })

    return { id }
  })

export const getBookmark = createServerFn({ method: 'GET' })
  .validator(v.object({ id: v.string() }))
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const [bookmark] = await db
      .select()
      .from(bookmarkTable)
      .where(and(eq(bookmarkTable.id, ctx.data.id), eq(bookmarkTable.userId, session.user.id)))
      .limit(1)

    if (bookmark == null) {
      throw new Error('Bookmark not found')
    }

    return bookmark
  })

export const updateBookmark = createServerFn({ method: 'POST' })
  .validator(updateBookmarkInputSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const { id, url, title, note } = ctx.data

    const [existing] = await db
      .select()
      .from(bookmarkTable)
      .where(and(eq(bookmarkTable.id, id), eq(bookmarkTable.userId, session.user.id)))
      .limit(1)

    if (existing == null) {
      throw new Error('Bookmark not found')
    }

    try {
      await db
        .update(bookmarkTable)
        .set({ url, title, note, updatedAt: new Date() })
        .where(eq(bookmarkTable.id, id))
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('URL already exists')
      }
      throw error
    }

    return { id }
  })
```

- [ ] **Step 3: 型エラーがないことを確認**

Run: `pnpm run typecheck`
Expected: PASS

---

### Task 2: 編集画面を実装

**Files:**

- Modify: `src/routes/_protected/bookmarks/$id/edit.tsx`

- [ ] **Step 1: ファイル全体を以下のように置き換える**

```tsx
import { Input } from '@base-ui/react'
import { Field, getInput, useForm } from '@formisch/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useActionState } from 'react'
import * as v from 'valibot'

import {
  getBookmark,
  updateBookmark
} from '../../../../features/bookmarks/bookmark.function'
import type { BookmarkSelectType } from '../../../../db/schema/bookmark'

export const Route = createFileRoute('/_protected/bookmarks/$id/edit')({
  loader: async ({ params }) => {
    const bookmark = await getBookmark({ data: { id: params.id } })
    return { bookmark }
  },
  component: RouteComponent
})

function RouteComponent() {
  const { bookmark } = Route.useLoaderData()
  const navigate = useNavigate()

  async function submitAction({
    url,
    title,
    note
  }: {
    url: string
    title: string
    note: string | null
  }) {
    await updateBookmark({ data: { id: bookmark.id, url, title, note } })

    await navigate({
      to: '/bookmarks/$id',
      params: { id: bookmark.id },
      state: { bookmarkUpdated: true }
    })
  }

  return (
    <div>
      <h1>ブックマーク編集</h1>

      <EditBookmarkForm
        bookmark={bookmark}
        submitAction={submitAction}
      />

      <Link
        to='/bookmarks/$id'
        params={{ id: bookmark.id }}>
        詳細へ戻る
      </Link>
    </div>
  )
}

interface EditBookmarkFormProps {
  bookmark: BookmarkSelectType
  submitAction: (values: {
    url: string
    title: string
    note: string | null
  }) => Promise<void>
}

function EditBookmarkForm({ bookmark, submitAction }: EditBookmarkFormProps) {
  const editBookmarkFormSchema = v.object({
    url: v.pipe(v.string(), v.url()),
    title: v.string(),
    note: v.nullable(v.string())
  })

  const editBookmarkForm = useForm({
    initialInput: {
      url: bookmark.url,
      title: bookmark.title,
      note: bookmark.note ?? ''
    },
    schema: editBookmarkFormSchema
  })

  const [_, throwError, isPending] = useActionState(async () => {
    const currentRawUrl = getInput(editBookmarkForm, { path: ['url'] }) ?? ''
    const currentRawTitle = getInput(editBookmarkForm, { path: ['title'] }) ?? ''
    const currentRawNote = getInput(editBookmarkForm, { path: ['note'] })
    const note = currentRawNote === '' ? null : currentRawNote

    await submitAction({ url: currentRawUrl, title: currentRawTitle, note })
  }, null)

  return (
    <form action={throwError}>
      <fieldset>
        <legend>ブックマーク編集</legend>

        <Field
          of={editBookmarkForm}
          path={['url']}>
          {(field) => (
            <label htmlFor={field.props.name}>
              URL
              <Input
                id={field.props.name}
                value={field.input}
                type='url'
                onValueChange={(newValue) => {
                  field.onChange(newValue)
                }}
                required
              />
            </label>
          )}
        </Field>

        <Field
          of={editBookmarkForm}
          path={['title']}>
          {(field) => (
            <label htmlFor={field.props.name}>
              タイトル
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

        <Field
          of={editBookmarkForm}
          path={['note']}>
          {(field) => (
            <label htmlFor={field.props.name}>
              メモ
              <Input
                id={field.props.name}
                value={field.input ?? ''}
                type='text'
                onValueChange={(newValue) => {
                  field.onChange(newValue)
                }}
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

- [ ] **Step 2: 型エラーがないことを確認**

Run: `pnpm run typecheck`
Expected: PASS

---

### Task 3: ルーター履歴状態の型を拡張

**Files:**

- Modify: `src/router.tsx`

- [ ] **Step 1: `HistoryState` に `bookmarkUpdated` を追加**

```typescript
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }

  interface HistoryState {
    newBookmarkCreated?: boolean
    newTagCreated?: boolean
    bookmarkUpdated?: boolean
  }
}
```

- [ ] **Step 2: 型エラーがないことを確認**

Run: `pnpm run typecheck`
Expected: PASS

---

### Task 4: 詳細画面に更新完了メッセージを表示

**Files:**

- Modify: `src/routes/_protected/bookmarks/$id/index.tsx`

- [ ] **Step 1: `bookmarkUpdated` 状態を読み取ってメッセージを表示**

```tsx
import { createFileRoute, Link, useRouterState } from '@tanstack/react-router'
import * as v from 'valibot'

const bookmarkDetailSearchSchema = v.object({
  created: v.optional(v.boolean())
})

export const Route = createFileRoute('/_protected/bookmarks/$id/')({
  validateSearch: bookmarkDetailSearchSchema,
  component: RouteComponent
})

function RouteComponent() {
  const { id } = Route.useParams()

  const { newBookmarkCreated, bookmarkUpdated } = useRouterState({
    select: (s) => s.location.state
  })

  return (
    <div>
      {newBookmarkCreated && <div role='alert'>ブックマークを登録しました</div>}
      {bookmarkUpdated && <div role='alert'>ブックマークを更新しました</div>}

      <h1>ブックマーク詳細</h1>

      <p>ID: {id}</p>

      <nav>
        <Link
          to='/bookmarks/$id/edit'
          params={{ id }}>
          編集
        </Link>

        <Link
          to='/'
          search={{ tagMode: 'and', sort: 'newest' }}>
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

### Task 5: 更新入力スキーマの単体テストを追加

**Files:**

- Create: `src/features/bookmarks/bookmark.function.test.ts`

- [ ] **Step 1: テストファイルを作成**

```typescript
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { updateBookmarkInputSchema } from './bookmark.function'

describe('updateBookmarkInputSchema', () => {
  test('accepts valid input', async () => {
    const result = await v.parseAsync(updateBookmarkInputSchema, {
      id: 'test-bookmark-id',
      url: 'https://example.com',
      title: 'Example Site',
      note: 'memo'
    })

    expect(result).toStrictEqual({
      id: 'test-bookmark-id',
      url: 'https://example.com',
      title: 'Example Site',
      note: 'memo'
    })
  })

  test('accepts null note', async () => {
    const result = await v.parseAsync(updateBookmarkInputSchema, {
      id: 'test-bookmark-id',
      url: 'https://example.com',
      title: 'Example Site',
      note: null
    })

    expect(result.note).toBeNull()
  })

  test('rejects invalid url', async () => {
    await expect(
      v.parseAsync(updateBookmarkInputSchema, {
        id: 'test-bookmark-id',
        url: 'not-a-url',
        title: 'Example Site',
        note: null
      })
    ).rejects.toThrow()
  })

  test('rejects empty title', async () => {
    await expect(
      v.parseAsync(updateBookmarkInputSchema, {
        id: 'test-bookmark-id',
        url: 'https://example.com',
        title: '',
        note: null
      })
    ).rejects.toThrow()
  })
})
```

- [ ] **Step 2: テストが通ることを確認**

Run: `pnpm run test -- src/features/bookmarks/bookmark.function.test.ts`
Expected: PASS

---

### Task 6: ルート生成と品質チェック

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

### Task 7: 動作確認

**Files:**

- ブラウザ

- [ ] **Step 1: 開発サーバーを起動**

Run: `pnpm run dev`

- [ ] **Step 2: 一覧から既存ブックマークの詳細画面を開き、「編集」リンクを押下**

Expected: `/bookmarks/$id/edit` に遷移し、既存の URL・タイトル・メモがフォームに入力されている

- [ ] **Step 3: タイトルとメモを変更して「更新」を押下**

Expected:

- 詳細画面（`/bookmarks/$id`）へ遷移する
- 「ブックマークを更新しました」のメッセージが表示される
- 更新日時が更新順で先頭に近い位置に反映される（一覧画面へ戻って確認）

- [ ] **Step 4: メモ欄を空にして更新**

Expected:

- 更新が成功する
- メモが `null` として保存される

---

### Task 8: コミット

- [ ] **Step 1: 変更をステージしてコミット**

```bash
git add src/features/bookmarks/bookmark.function.ts src/features/bookmarks/bookmark.function.test.ts src/routes/_protected/bookmarks/\$id/edit.tsx src/routes/_protected/bookmarks/\$id/index.tsx src/router.tsx src/routeTree.gen.ts
git commit -m "feat: implement bookmark editing screen (#61)"
```

---

## Self-Review

- **Spec coverage:**
  - ブックマーク単体取得と所有者判定 → Task 1
  - ブックマーク更新（URL・タイトル・メモ） → Task 1 / Task 2
  - URL 重複時のエラー → Task 1（`UNIQUE constraint failed` を検知）
  - 編集画面のフォーム実装 → Task 2
  - 更新完了メッセージ → Task 3 / Task 4
  - 入力スキーマの検証テスト → Task 5
  - 品質チェックと動作確認 → Task 6 / Task 7
- **Placeholder scan:** TBD / TODO / "implement later" / "適切なエラー処理" なし。各ステップに実際のコードとコマンドを記載。
- **Type consistency:** `updateBookmark` は `{ id: string }` を返却し、`navigate` 時に `bookmark.id` を `params` に渡す。`HistoryState` に追加した `bookmarkUpdated` は詳細画面で `useRouterState` により読み取る。
- **Scope note:** タグ編集は本 Issue の対象外。タグ付与 UI はブックマーク新規登録画面にも未実装のため、編集画面でも URL・タイトル・メモのみを扱う。
