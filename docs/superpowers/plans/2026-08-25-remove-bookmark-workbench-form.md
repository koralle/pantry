# Remove BookmarkWorkbenchForm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ブックマーク新規作成画面を編集画面と同じ `BookmarkForm` に切り替え、`BookmarkWorkbenchForm` を削除する。

**Architecture:** `/bookmarks/new` ルートが `BookmarkForm` を直接使う。ルートが空の初期値・作成ラベル・`fetchTitleAction`・`serverError` を渡す。`BookmarkCreator` は作らない。`BookmarkEditor` は編集専用のままにする。`fetchTitleAction` は編集ルートから抽出せず、新規ルートへ同じ実装を置く。

**Tech Stack:** React, TanStack Router, Conform (`BookmarkForm` 内部), Valibot domain schema, oRPC, Vitest source-scan tests.

**Spec:** Approved in-session design (bounded): ルートが直接 `BookmarkForm` を使う。`BookmarkWorkbenchForm` と旧 `hooks/use-bookmark-title-fetch.ts` は不要になる。

## Global Constraints

- ルートが直接 `BookmarkForm` を使う。`BookmarkCreator` を新設しない。
- `BookmarkEditor` を作成画面へ流用しない。編集ルートは変更しない。
- `fetchTitleAction` は編集ルートから抽出せず、新規ルートへ同じ実装を置く（意図的な複製）。
- 作成ラベルは `submitLabel='登録'`、`pendingLabel='登録中…'`、`legend='ブックマーク新規登録'`。
- 初期値は `{ url: '', title: '', note: null }`。
- 保存エラーは `getCreateBookmarkErrorMessage` で `BookmarkFormServerError.summary` に写す。`UNAUTHORIZED`（関数が `null` を返す）はフォームに出さない。
- 保存成功後の遷移失敗は `'保存は完了しましたが、画面の移動に失敗しました'` を summary に出し、保存失敗と混ぜない。
- `src/features/bookmarks/components/bookmark-workbench-form.tsx` と `src/features/bookmarks/hooks/use-bookmark-title-fetch.ts` を削除する。
- 過去の spec / plan ドキュメントは更新しない。
- 既存テストのスタイル（ルートソースの走査）を維持する。Error の class 名 / `error.message` で文言を決めない。

---

## File Structure

- `src/routes/_protected/bookmarks/new/index.tsx` — 新規作成ページ境界。`BookmarkForm` を描画し、mutation / 遷移 / serverError / title fetch をここで閉じる。
- `src/routes/_protected/bookmarks/new/index.test.ts` — ルート契約のソース走査テスト。
- `src/features/bookmarks/components/bookmark-editor/bookmark-form/` — 既存。変更しない。
- `src/features/bookmarks/components/bookmark-workbench-form.tsx` — 削除。
- `src/features/bookmarks/hooks/use-bookmark-title-fetch.ts` — 削除。workbench 専用。

---

### Task 1: 新規作成ルートを BookmarkForm に切り替える

**Files:**

- Modify: `src/routes/_protected/bookmarks/new/index.test.ts`
- Modify: `src/routes/_protected/bookmarks/new/index.tsx`

**Interfaces:**

- Consumes: `BookmarkForm` (`BookmarkFormProps`), `BookmarkFormServerError`, `BookmarkFormSubmitValues`, `BookmarkTitleFetchAction` from `src/features/bookmarks/components/bookmark-editor/bookmark-form`
- Consumes: `buildNewBookmarkCommand`, `getCreateBookmarkErrorMessage`, `refreshAfterCreateBookmark`, `getTitleFetchErrorMessage`, `getRpcClient`, `orpc.bookmarks.create.mutationOptions`
- Produces: `/bookmarks/new` が空初期値の `BookmarkForm` を描画し、登録成功で詳細へ遷移する。`BookmarkWorkbenchForm` への import を持たない。

- [ ] **Step 1: Write the failing route contract tests**

Replace `src/routes/_protected/bookmarks/new/index.test.ts` with:

```ts
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { buildNewBookmarkCommand } from '../../../../features/bookmarks/components/new-bookmark-command'

const dir = dirname(fileURLToPath(import.meta.url))
const routeSource = readFileSync(join(dir, 'index.tsx'), 'utf8')
const editRouteSource = readFileSync(join(dir, '../$id/edit.tsx'), 'utf8')

describe('buildNewBookmarkCommand', () => {
  test('新規ブックマークではタグを空配列で送る', () => {
    expect(
      buildNewBookmarkCommand({
        url: 'https://example.com/article',
        title: 'Example Article',
        note: 'メモ'
      })
    ).toStrictEqual({
      url: 'https://example.com/article',
      title: 'Example Article',
      note: 'メモ',
      tags: []
    })
  })
})

describe('new bookmark route', () => {
  test('BookmarkForm を使う', () => {
    expect(routeSource).toContain(
      "from '../../../../features/bookmarks/components/bookmark-editor/bookmark-form'"
    )
    expect(routeSource).toContain('<BookmarkForm')
    expect(routeSource).not.toContain('BookmarkWorkbenchForm')
    expect(routeSource).not.toContain('bookmark-workbench-form')
  })

  test('新規作成ラベルと空の初期値を渡す', () => {
    expect(routeSource).toContain("submitLabel='登録'")
    expect(routeSource).toContain("pendingLabel='登録中…'")
    expect(routeSource).toContain("legend='ブックマーク新規登録'")
    expect(routeSource).toContain("url: ''")
    expect(routeSource).toContain("title: ''")
    expect(routeSource).toContain('note: null')
  })

  test('CreateBookmark を oRPC mutationOptions 経由で送る', () => {
    expect(routeSource).toContain('orpc.bookmarks.create.mutationOptions')
    expect(routeSource).toContain('refreshAfterCreateBookmark')
  })

  test('旧 Server Function に依存しない', () => {
    expect(routeSource).not.toContain("from '../functions/add-bookmark'")
    expect(routeSource).not.toContain('addBookmark({')
  })

  test('Error の class 名と name に依存しない', () => {
    expect(routeSource).toContain('getCreateBookmarkErrorMessage')
    expect(routeSource).not.toContain('error.name')
    expect(routeSource).not.toContain('instanceof Error')
    expect(routeSource).not.toContain('error.message')
  })

  test('UNAUTHORIZED はフォームエラーにしない', () => {
    expect(routeSource).toContain('if (message !== null)')
  })

  test('保存成功後の遷移失敗は保存失敗と混ぜない', () => {
    expect(routeSource).toContain('保存は完了しましたが、画面の移動に失敗しました')
  })
})

describe('title fetch consumers', () => {
  test('new route の action は code 契約だけで文言を決める', () => {
    expect(routeSource).toContain('bookmarks.title')
    expect(routeSource).not.toContain('fetchBookmarkTitle')
    expect(routeSource).not.toContain('instanceof Error')
    expect(routeSource).not.toContain('error.message')
    expect(routeSource).toContain('getTitleFetchErrorMessage')
  })

  test('edit route の action は code 契約だけで文言を決める', () => {
    expect(editRouteSource).toContain('bookmarks.title')
    expect(editRouteSource).not.toContain('fetchBookmarkTitle')
    expect(editRouteSource).not.toContain('instanceof Error')
    expect(editRouteSource).not.toContain('error.message')
    expect(editRouteSource).toContain('getTitleFetchErrorMessage')
  })
})
```

Do not read `bookmark-workbench-form.tsx` or `hooks/use-bookmark-title-fetch.ts` in this test file. Those files still exist until Task 2.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm vitest run src/routes/_protected/bookmarks/new/index.test.ts`

Expected: FAIL because `index.tsx` still imports `BookmarkWorkbenchForm` and does not contain `BookmarkForm`, `legend='ブックマーク新規登録'`, `getTitleFetchErrorMessage`, or the navigation-failure summary.

- [ ] **Step 3: Switch the route to BookmarkForm**

Replace `src/routes/_protected/bookmarks/new/index.tsx` with:

```tsx
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import * as v from 'valibot'

import { BookmarkForm } from '../../../../features/bookmarks/components/bookmark-editor/bookmark-form'
import type {
  BookmarkFormServerError,
  BookmarkFormSubmitValues,
  BookmarkTitleFetchAction
} from '../../../../features/bookmarks/components/bookmark-editor/bookmark-form'
import { buildNewBookmarkCommand } from '../../../../features/bookmarks/components/new-bookmark-command'
import { getCreateBookmarkErrorMessage } from '../../../../features/bookmarks/lib/get-create-bookmark-error-message'
import { getTitleFetchErrorMessage } from '../../../../features/bookmarks/lib/get-title-fetch-error-message'
import { refreshAfterCreateBookmark } from '../../../../features/bookmarks/lib/refresh-after-create-bookmark'
import { buildListBackSearch } from '../../../../features/navigation/lib/bookmark-search-builders'
import { orpc } from '../../../../rpc/query'
import { getRpcClient } from '../../../../rpc/runtime-client'
import { StyledLink } from '../../../../shared/components/styled-link'
import {
  workbench,
  workbenchLead,
  workbenchNav,
  workbenchTitle
} from '../../../../styles/workbench'

const bookmarkNewSearchSchema = v.object({
  tags: v.optional(v.array(v.string()))
})

const bookmarkTitleFetchFailedMessage = 'タイトルを取得できませんでした。手入力で続けられます'

/**
 * タイトル取得 action。BookmarkForm 側のラッパーを経て useActionState に渡り、
 * bookmarks.title procedure の null / throw を code 契約だけで表示用メッセージへ変換する。
 */
const fetchTitleAction: BookmarkTitleFetchAction = async (_previousState, { url }) => {
  try {
    const fetchedTitle = await (await getRpcClient()).bookmarks.title({ url })
    if (fetchedTitle === null) {
      return {
        status: 'error',
        message: bookmarkTitleFetchFailedMessage
      }
    }
    return { status: 'success', title: fetchedTitle }
  } catch (error: unknown) {
    return {
      status: 'error',
      message: getTitleFetchErrorMessage(error)
    }
  }
}

export const Route = createFileRoute('/_protected/bookmarks/new/')({
  validateSearch: bookmarkNewSearchSchema,
  component: RouteComponent
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const router = useRouter()
  const listSearch = buildListBackSearch(search.tags)
  const [serverError, setServerError] = useState<BookmarkFormServerError | null>(null)
  const mutation = useMutation(
    orpc.bookmarks.create.mutationOptions({
      onSuccess: () => {
        refreshAfterCreateBookmark(router)
      }
    })
  )

  async function handleSubmit(values: BookmarkFormSubmitValues) {
    setServerError(null)

    let id: string
    try {
      const created = await mutation.mutateAsync(
        buildNewBookmarkCommand({
          url: values.url,
          title: values.title,
          note: values.note
        })
      )
      id = created.id
    } catch (error: unknown) {
      const message = getCreateBookmarkErrorMessage(error)
      if (message !== null) {
        setServerError({ summary: message })
      }
      return
    }

    try {
      await navigate({
        to: '/bookmarks/$id',
        params: { id },
        search: search.tags !== undefined ? { tags: search.tags } : {},
        state: { newBookmarkCreated: true }
      })
    } catch {
      setServerError({
        summary: '保存は完了しましたが、画面の移動に失敗しました'
      })
    }
  }

  return (
    <section
      className={workbench}
      aria-label='ブックマーク新規作成'>
      <nav className={workbenchNav}>
        <StyledLink
          to='/'
          search={listSearch}
          visual='accent'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </StyledLink>
      </nav>

      <h1 className={workbenchTitle}>ブックマークを追加</h1>
      <p className={workbenchLead}>URLを入れて、必要ならタイトルを取得してから保存します。</p>

      <BookmarkForm
        initialValues={{ url: '', title: '', note: null }}
        serverError={serverError}
        submitLabel='登録'
        pendingLabel='登録中…'
        legend='ブックマーク新規登録'
        onSubmit={handleSubmit}
        fetchTitleAction={fetchTitleAction}
      />
    </section>
  )
}
```

Do not change the edit route. Do not extract `fetchTitleAction` into a shared module. Do not add `onClearFieldError` (create errors are summary-only).

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm vitest run src/routes/_protected/bookmarks/new/index.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/routes/_protected/bookmarks/new/index.tsx src/routes/_protected/bookmarks/new/index.test.ts
git commit -m "$(cat <<'EOF'
refactor: use BookmarkForm on the new bookmark screen

EOF
)"
```

---

### Task 2: BookmarkWorkbenchForm と旧 title-fetch hook を削除する

**Files:**

- Modify: `src/routes/_protected/bookmarks/new/index.test.ts`
- Delete: `src/features/bookmarks/components/bookmark-workbench-form.tsx`
- Delete: `src/features/bookmarks/hooks/use-bookmark-title-fetch.ts`

**Interfaces:**

- Consumes: Task 1 の新規ルートが `BookmarkForm` を使うこと。workbench form / 旧 hook は誰からも import されない。
- Produces: 両ファイルがリポジトリから消える。`src/` に `bookmark-workbench-form` と `hooks/use-bookmark-title-fetch` の参照が残らない。

- [ ] **Step 1: Write the failing deletion tests**

Add this describe block to `src/routes/_protected/bookmarks/new/index.test.ts`, after the existing imports. Add `existsSync` to the `node:fs` import:

```ts
import { existsSync, readFileSync } from 'node:fs'
```

Then append:

```ts
describe('removed workbench form', () => {
  test('BookmarkWorkbenchForm は削除されている', () => {
    expect(
      existsSync(join(dir, '../../../../features/bookmarks/components/bookmark-workbench-form.tsx'))
    ).toBe(false)
  })

  test('旧 title fetch hook は削除されている', () => {
    expect(
      existsSync(join(dir, '../../../../features/bookmarks/hooks/use-bookmark-title-fetch.ts'))
    ).toBe(false)
  })
})
```

- [ ] **Step 2: Run the focused test and verify the new tests fail**

Run: `pnpm vitest run src/routes/_protected/bookmarks/new/index.test.ts`

Expected: the two new tests FAIL because both files still exist. Task 1 tests remain PASS.

- [ ] **Step 3: Delete the unused files**

Delete:

- `src/features/bookmarks/components/bookmark-workbench-form.tsx`
- `src/features/bookmarks/hooks/use-bookmark-title-fetch.ts`

Do not leave unused re-exports. Do not edit historical docs.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm vitest run src/routes/_protected/bookmarks/new/index.test.ts`

Expected: PASS, including the two deletion tests.

Then run: `pnpm run test`

Expected: full suite PASS.

- [ ] **Step 5: Commit**

```bash
git add src/routes/_protected/bookmarks/new/index.test.ts
git add -u src/features/bookmarks/components/bookmark-workbench-form.tsx src/features/bookmarks/hooks/use-bookmark-title-fetch.ts
git commit -m "$(cat <<'EOF'
refactor: remove BookmarkWorkbenchForm and unused title-fetch hook

EOF
)"
```
