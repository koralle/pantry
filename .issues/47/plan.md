# 画面パス設計（Issue #47）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Issue #47 の画面パス設計を TanStack Router のルートとして実装し、 `/` 一覧、 `/bookmarks/*`、 `/settings`、 `/tags` の画面遷移とクエリパラメータを有効にする。

**Architecture:** ファイルベースルーティングに従い、 `_protected` レイアウト配下にブックマーク関連ルートを配置する。 `/bookmarks` は `/` への 301 リダイレクト、 `/` は検索・絞り込み・並び順のクエリパラメータを受け付ける。各画面はまずページシェルと遷移導線を実装し、中身の機能は別タスクとする。

**Tech Stack:** TanStack Router / TanStack Start、 React、 Valibot、 Vitest

---

## ファイル構成

| ファイル                                                    | 責務                                        |
| ----------------------------------------------------------- | ------------------------------------------- |
| `src/routes/_protected/-lib/bookmark-search-schema.ts`      | 一覧画面クエリパラメータの Valibot スキーマ |
| `src/routes/_protected/-lib/bookmark-search-schema.test.ts` | スキーマの単体テスト                        |
| `src/routes/_protected/index.tsx`                           | `/` ブックマーク一覧（既存を置き換え）      |
| `src/routes/_protected/bookmarks/index.tsx`                 | `/bookmarks` → `/` への 301 リダイレクト    |
| `src/routes/_protected/bookmarks/new.tsx`                   | `/bookmarks/new` 新規作成画面シェル         |
| `src/routes/_protected/bookmarks/$id.tsx`                   | `/bookmarks/:id` 詳細画面シェル             |
| `src/routes/_protected/bookmarks/$id.edit.tsx`              | `/bookmarks/:id/edit` 編集画面シェル        |
| `src/routes/_protected/settings/index.tsx`                  | `/settings` 設定画面シェル                  |
| `src/routes/_protected/tags/new.tsx`                        | `/tags/new` タグ新規登録画面シェル          |
| `src/routes/_protected/tags/$id.edit.tsx`                   | `/tags/:id/edit` タグ編集画面シェル         |
| `src/routes/_protected.tsx`                                 | 保護レイアウト（ナビゲーション導線を追加）  |

---

### Task 1: 一覧画面クエリパラメータスキーマを定義する

**Files:**

- Create: `src/routes/_protected/-lib/bookmark-search-schema.ts`
- Test: `src/routes/_protected/-lib/bookmark-search-schema.test.ts`

- [ ] **Step 1: スキーマファイルを作成する**

```typescript
// src/routes/_protected/-lib/bookmark-search-schema.ts
import * as v from 'valibot'

export const bookmarkSearchSchema = v.object({
  q: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  tagMode: v.optional(v.picklist(['and', 'or']), 'and'),
  sort: v.optional(v.picklist(['newest', 'updated']), 'newest')
})

export type BookmarkSearchSchema = v.InferOutput<typeof bookmarkSearchSchema>
```

- [ ] **Step 2: テストファイルを作成する**

```typescript
// src/routes/_protected/-lib/bookmark-search-schema.test.ts
import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { bookmarkSearchSchema } from './bookmark-search-schema'

describe('bookmarkSearchSchema', () => {
  test('default values', async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, {})
    expect(result).toStrictEqual({ tagMode: 'and', sort: 'newest' })
  })

  test('parses all fields', async () => {
    const result = await v.parse(bookmarkSearchSchema, {
      q: 'react',
      tags: ['frontend', 'typescript'],
      tagMode: 'or',
      sort: 'updated'
    })
    expect(result).toStrictEqual({
      q: 'react',
      tags: ['frontend', 'typescript'],
      tagMode: 'or',
      sort: 'updated'
    })
  })

  test('rejects invalid tagMode', async () => {
    expect(() => await v.parseAsync(bookmarkSearchSchema, { tagMode: 'xor' })).toThrow()
  })

  test('rejects invalid sort', async () => {
    expect(() => await v.parseAsync(bookmarkSearchSchema, { sort: 'oldest' })).toThrow()
  })
})
```

- [ ] **Step 3: テストを実行して失敗を確認する**

Run: `pnpm vitest run src/routes/_protected/-lib/bookmark-search-schema.test.ts`

Expected: FAIL（`bookmarkSearchSchema` が未定義のため）

- [ ] **Step 4: テストを実行して成功を確認する**

Run: `pnpm vitest run src/routes/_protected/-lib/bookmark-search-schema.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/_protected/-lib/bookmark-search-schema.ts src/routes/_protected/-lib/bookmark-search-schema.test.ts
git commit -m "feat(routes): add bookmark list search params schema"
```

---

### Task 2: `/bookmarks` から `/` への 301 リダイレクトを実装する

**Files:**

- Create: `src/routes/_protected/bookmarks/index.tsx`

- [ ] **Step 1: リダイレクトルートを作成する**

```tsx
// src/routes/_protected/bookmarks/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { redirect } from '@tanstack/react-start'

export const Route = createFileRoute('/_protected/bookmarks/')({
  beforeLoad: () => {
    throw redirect({
      to: '/',
      statusCode: 301
    })
  }
})
```

- [ ] **Step 2: 開発サーバーでリダイレクトを確認する**

Run: `pnpm run dev`

手順:

1. ブラウザで `http://localhost:3000/bookmarks` を開く
2. `/` にリダイレクトされることを確認
3. 開発者ツールの Network タブで 301 レスポンスを確認

- [ ] **Step 3: Commit**

```bash
git add src/routes/_protected/bookmarks/index.tsx
git commit -m "feat(routes): add /bookmarks redirect to /"
```

---

### Task 3: `/` のブックマーク一覧画面を実装する

**Files:**

- Modify: `src/routes/_protected/index.tsx`

- [ ] **Step 1: 既存のプレースホルダーを置き換える**

```tsx
// src/routes/_protected/index.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import * as v from 'valibot'

import { bookmarkSearchSchema } from './-lib/bookmark-search-schema'

export const Route = createFileRoute('/_protected/')({
  validateSearch: (search) => v.parseAsync(bookmarkSearchSchema, search),
  component: RouteComponent
})

function RouteComponent() {
  const search = Route.useSearch()

  return (
    <div>
      <h1>ブックマーク一覧</h1>
      <div>
        <p>検索: {search.q ?? '（なし）'}</p>
        <p>タグ: {search.tags?.join(', ') ?? '（なし）'}</p>
        <p>タグモード: {search.tagMode}</p>
        <p>並び順: {search.sort}</p>
      </div>
      <nav>
        <Link to='/bookmarks/new'>新規作成</Link>
      </nav>
    </div>
  )
}
```

- [ ] **Step 2: クエリパラメータを確認する**

Run: `pnpm run dev`

手順:

1. `http://localhost:3000/?q=react&tags=frontend&tags=typescript&tagMode=or&sort=updated` を開く
2. 画面に各パラメータが表示されることを確認

- [ ] **Step 3: typecheck を実行する**

Run: `pnpm run typecheck`

Expected: 成功

- [ ] **Step 4: Commit**

```bash
git add src/routes/_protected/index.tsx
git commit -m "feat(routes): implement bookmark list page with query params"
```

---

### Task 4: `/bookmarks/new` 新規作成画面シェルを実装する

**Files:**

- Create: `src/routes/_protected/bookmarks/new.tsx`

- [ ] **Step 1: 新規作成ルートを作成する**

```tsx
// src/routes/_protected/bookmarks/new.tsx
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/bookmarks/new')({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <div>
      <h1>ブックマーク新規作成</h1>
      <form>
        <label>
          URL
          <input
            type='url'
            name='url'
            required
          />
        </label>
        <button type='submit'>保存</button>
      </form>
      <Link to='/'>一覧へ戻る</Link>
    </div>
  )
}
```

- [ ] **Step 2: 一覧からの遷移を確認する**

Run: `pnpm run dev`

手順:

1. `/` を開く
2. 「新規作成」リンクをクリック
3. `/bookmarks/new` に遷移することを確認

- [ ] **Step 3: Commit**

```bash
git add src/routes/_protected/bookmarks/new.tsx
git commit -m "feat(routes): add /bookmarks/new create page shell"
```

---

### Task 5: `/bookmarks/:id` 詳細画面シェルを実装する

**Files:**

- Create: `src/routes/_protected/bookmarks/$id.tsx`

- [ ] **Step 1: 詳細ルートを作成する**

```tsx
// src/routes/_protected/bookmarks/$id.tsx
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/bookmarks/$id')({
  component: RouteComponent
})

function RouteComponent() {
  const { id } = Route.useParams()

  return (
    <div>
      <h1>ブックマーク詳細</h1>
      <p>ID: {id}</p>
      <nav>
        <Link
          to='/bookmarks/$id/edit'
          params={{ id }}>
          編集
        </Link>
        <Link to='/'>一覧へ戻る</Link>
      </nav>
    </div>
  )
}
```

- [ ] **Step 2: 手動でパラメータ遷移を確認する**

Run: `pnpm run dev`

手順:

1. `http://localhost:3000/bookmarks/01900000-0000-0000-0000-000000000000` を開く
2. ID が表示されることを確認
3. 「編集」リンクをクリックして `/bookmarks/.../edit` に遷移することを確認

- [ ] **Step 3: Commit**

```bash
git add src/routes/_protected/bookmarks/$id.tsx
git commit -m "feat(routes): add /bookmarks/:id detail page shell"
```

---

### Task 6: `/bookmarks/:id/edit` 編集画面シェルを実装する

**Files:**

- Create: `src/routes/_protected/bookmarks/$id.edit.tsx`

- [ ] **Step 1: 編集ルートを作成する**

```tsx
// src/routes/_protected/bookmarks/$id.edit.tsx
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/bookmarks/$id/edit')({
  component: RouteComponent
})

function RouteComponent() {
  const { id } = Route.useParams()

  return (
    <div>
      <h1>ブックマーク編集</h1>
      <p>ID: {id}</p>
      <form>
        <label>
          タイトル
          <input
            type='text'
            name='title'
          />
        </label>
        <button type='submit'>更新</button>
      </form>
      <Link
        to='/bookmarks/$id'
        params={{ id }}>
        詳細へ戻る
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: ブラウザバックを確認する**

Run: `pnpm run dev`

手順:

1. `/bookmarks/:id` を開く
2. 「編集」リンクをクリック
3. ブラウザの「戻る」ボタンで詳細画面に戻ることを確認
4. もう一度「戻る」で一覧画面に戻ることを確認

- [ ] **Step 3: Commit**

```bash
git add src/routes/_protected/bookmarks/$id.edit.tsx
git commit -m "feat(routes): add /bookmarks/:id/edit edit page shell"
```

---

### Task 7: `/settings` 設定画面シェルを実装する

**Files:**

- Create: `src/routes/_protected/settings/index.tsx`

- [ ] **Step 1: 設定ルートを作成する**

```tsx
// src/routes/_protected/settings/index.tsx
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/settings/')({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <div>
      <h1>設定</h1>
      <section>
        <h2>アカウント</h2>
        <p>アカウント設定をここに配置する</p>
      </section>
      <section>
        <h2>Better Auth 連携</h2>
        <p>連携状態をここに表示する</p>
      </section>
      <Link to='/'>一覧へ戻る</Link>
    </div>
  )
}
```

- [ ] **Step 2: 遷移を確認する**

Run: `pnpm run dev`

手順:

1. `http://localhost:3000/settings` を開く
2. 設定画面が表示されることを確認

- [ ] **Step 3: Commit**

```bash
git add src/routes/_protected/settings/index.tsx
git commit -m "feat(routes): add /settings page shell"
```

---

### Task 8: 保護レイアウトにナビゲーション導線を追加する

**Files:**

- Modify: `src/routes/_protected.tsx`

- [ ] **Step 1: 既存のレイアウトを確認する**

`src/routes/_protected.tsx` にはすでに Sign Out ボタンと `Outlet` がある。ナビゲーションを追加しつつ、既存の Sign Out 機能は保持する。

- [ ] **Step 2: ナビゲーションを追加する**

```tsx
// src/routes/_protected.tsx
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, Outlet, redirect, useRouter } from '@tanstack/react-router'
import { useTransition } from 'react'

import { authClient } from '../features/auth/auth-client'
import { getSession } from '../features/auth/auth.function'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()

    if (!session) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href }
      })
    }

    return { user: session.user }
  },
  component: () => <Layout />
})

function Layout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = async () => {
    startTransition(async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            queryClient.clear()
          }
        }
      })

      startTransition(async () => {
        await router.navigate({ to: '/sign-in' })
      })
    })
  }

  return (
    <div>
      <header>
        <nav>
          <Link to='/'>Pantry</Link>
          <Link to='/tags'>タグ</Link>
          <Link to='/settings'>設定</Link>
        </nav>
        <button
          type='button'
          onClick={handleClick}
          disabled={isPending}>
          Sign Out
        </button>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: 各画面でナビゲーションが表示されることを確認する**

Run: `pnpm run dev`

手順:

1. `/`、 `/tags`、 `/settings` を順に開く
2. 各画面でヘッダーナビゲーションが表示されることを確認

- [ ] **Step 4: Commit**

```bash
git add src/routes/_protected.tsx
git commit -m "feat(routes): add navigation to protected layout"
```

---

### Task 9: 静的解析と型チェックを実行する

- [ ] **Step 1: lint を実行する**

Run: `pnpm run lint`

Expected: 成功

- [ ] **Step 2: format を実行する**

Run: `pnpm run format`

Expected: 成功

- [ ] **Step 3: typecheck を実行する**

Run: `pnpm run typecheck`

Expected: 成功

- [ ] **Step 4: テストを実行する**

Run: `pnpm run test`

Expected: 全テスト PASS

- [ ] **Step 5: Commit（修正があれば）**

```bash
git add src/
git commit -m "chore: apply lint/format/typecheck fixes"
```

---

### Task 10: 画面遷移を総合確認する

- [ ] **Step 1: 開発サーバーを起動する**

Run: `pnpm run dev`

- [ ] **Step 2: 認証なしでのアクセス制御を確認する**

手順:

1. 未ログイン状態で `http://localhost:3000/` を開く
2. `/sign-in` にリダイレクトされることを確認
3. `/bookmarks/new`、 `/bookmarks/xxx`、 `/bookmarks/xxx/edit`、 `/settings` でも同様に `/sign-in` へ誘導されることを確認

- [ ] **Step 3: 認証後の画面遷移を確認する**

手順:

1. ログインする
2. `/` がブックマーク一覧として表示されることを確認
3. `/bookmarks` を開くと `/` に 301 リダイレクトされることを確認
4. 一覧から新規作成、詳細、編集、設定、タグ管理へ遷移できることを確認
5. ブラウザの「戻る / 進む」が自然に動作することを確認

- [ ] **Step 4: クエリパラメータを確認する**

手順:

1. `/bookmarks` ではなく `/` にリダイレクトされた後、 URL が `/` であることを確認
2. `/?q=react&tags=frontend&tagMode=or&sort=updated` を開き、各値が画面に反映されることを確認
3. ブラウザをリフレッシュしてもクエリパラメータが保持されることを確認

---

### Task 11: `/tags/new` タグ新規登録画面シェルを実装する

**Files:**

- Create: `src/routes/_protected/tags/new.tsx`

- [ ] **Step 1: 新規登録ルートを作成する**

```tsx
// src/routes/_protected/tags/new.tsx
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/tags/new')({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <div>
      <h1>タグ新規登録</h1>
      <form>
        <label>
          タグ名
          <input
            type='text'
            name='name'
            required
          />
        </label>
        <button type='submit'>保存</button>
      </form>
      <Link to='/tags'>一覧へ戻る</Link>
    </div>
  )
}
```

- [ ] **Step 2: タグ一覧からの遷移を確認する**

Run: `pnpm run dev`

手順:

1. `/tags` を開く
2. タグ一覧画面が表示されることを確認（新規作成へのリンクは将来のタスクで追加）
3. 直接 `http://localhost:3000/tags/new` を開き、画面が表示されることを確認

- [ ] **Step 3: Commit**

```bash
git add src/routes/_protected/tags/new.tsx
git commit -m "feat(routes): add /tags/new create page shell"
```

---

### Task 12: `/tags/:id/edit` タグ編集画面シェルを実装する

**Files:**

- Create: `src/routes/_protected/tags/$id.edit.tsx`

- [ ] **Step 1: 編集ルートを作成する**

```tsx
// src/routes/_protected/tags/$id.edit.tsx
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/tags/$id/edit')({
  component: RouteComponent
})

function RouteComponent() {
  const { id } = Route.useParams()

  return (
    <div>
      <h1>タグ編集</h1>
      <p>ID: {id}</p>
      <form>
        <label>
          タグ名
          <input
            type='text'
            name='name'
          />
        </label>
        <button type='submit'>更新</button>
      </form>
      <Link to='/tags'>一覧へ戻る</Link>
    </div>
  )
}
```

- [ ] **Step 2: 手動でパラメータ遷移を確認する**

Run: `pnpm run dev`

手順:

1. `http://localhost:3000/tags/1/edit` を開く
2. ID が表示されることを確認
3. 「一覧へ戻る」リンクで `/tags` に戻れることを確認

- [ ] **Step 3: Commit**

```bash
git add src/routes/_protected/tags/$id.edit.tsx
git commit -m "feat(routes): add /tags/:id/edit edit page shell"
```

---

## Self-Review Checklist

- [ ] Spec coverage: `/` 一覧、 `/bookmarks` リダイレクト、 `/bookmarks/new`、 `/bookmarks/:id`、 `/bookmarks/:id/edit`、 `/settings`、 `/tags/new`、 `/tags/:id/edit`、クエリパラメータ、ブラウザバックがすべてタスクに含まれている
- [ ] Placeholder scan: 計画内に "TBD" / "TODO" / "implement later" / "適切な" などのあいまいな記述がない
- [ ] Type consistency: `bookmarkSearchSchema` の型が `index.tsx` とテストで一致している
- [ ] Route consistency: TanStack Router のファイルベースルーティング命名規則（`$id.edit.tsx` など）に従っている
