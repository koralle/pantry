# 新しいタグ作成フロー 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** タグの重複を弾くサーバー側ガード、タグ一覧での常設インライン作成、およびブックマーク画面からのタグ選択＋インライン作成＋中間テーブル紐付けを実装する。

**Architecture:** `addTag` に `ErrorFactory` 由来の `TagNameAlreadyExistsError` による重複ガードを追加し、一覧画面には常設インライン入力コンポーネントを、ブックマーク画面にはタグ選択＋インライン作成コンポーネントを配置する。`addBookmark`/`updateBookmark` は入力に `tags` 配列を受け取り `bookmark_tags` 中間テーブルへ紐付けを保存する。

**Tech Stack:** TanStack Start（Server Functions）、Drizzle ORM（Turso/libsql）、valibot、@base-ui/react、@formisch/react、@praha/error-factory、Vitest（@cloudflare/vitest-pool-workers）

---

## ファイル構成

| ファイル                                                     | 責務                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| `src/features/tags/tag-errors.ts`（新規）                    | `TagNameAlreadyExistsError` を `ErrorFactory` で定義 |
| `src/features/tags/tag.function.ts`（修正）                  | `addTag` に重複チェックを追加                        |
| `src/features/tags/components/inline-add-tag.tsx`（新規）    | 一覧画面の常設インライン入力                         |
| `src/features/tags/tag.function.test.ts`（新規）             | `TagNameAlreadyExistsError` の単体テスト             |
| `src/features/bookmarks/bookmark.schema.ts`（修正）          | `addBookmark`/`updateBookmark` 入力に `tags` を追加  |
| `src/features/bookmarks/bookmark.function.ts`（修正）        | タグ紐付けの保存・置換ロジック                       |
| `src/features/bookmarks/components/tag-selector.tsx`（新規） | タグ選択＋インライン作成 UI                          |
| `src/routes/_protected/tags/index.tsx`（修正）               | 一覧にインライン入力を配置                           |
| `src/routes/_protected/bookmarks/new/index.tsx`（修正）      | 新規フォームにタグ選択を組み込み                     |
| `src/routes/_protected/bookmarks/$id/edit.tsx`（修正）       | 編集フォームにタグ選択を組み込み                     |

---

### Task 1: `TagNameAlreadyExistsError` を ErrorFactory で定義

**Files:**

- Create: `src/features/tags/tag-errors.ts`
- Test: `src/features/tags/tag.function.test.ts`

- [ ] **Step 1: 専用エラーを定義する**

```ts
// src/features/tags/tag-errors.ts
import { ErrorFactory } from '@praha/error-factory'

export class TagNameAlreadyExistsError extends ErrorFactory({
  name: 'TagNameAlreadyExistsError',
  message: 'タグ名が既に存在します'
}) {}
```

- [ ] **Step 2: 失敗するテストを書く**

```ts
// src/features/tags/tag.function.test.ts
import { describe, expect, test } from 'vitest'

import { TagNameAlreadyExistsError } from './tag-errors'

describe('TagNameAlreadyExistsError', () => {
  test('name とメッセージが期待通り', () => {
    const error = new TagNameAlreadyExistsError()

    expect(error.name).toBe('TagNameAlreadyExistsError')
    expect(error.message).toBe('タグ名が既に存在します')
  })

  test('Error のインスタンスでもある', () => {
    const error = new TagNameAlreadyExistsError()

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(TagNameAlreadyExistsError)
  })
})
```

- [ ] **Step 3: テストを実行して失敗することを確認**

Run: `pnpm run test src/features/tags/tag.function.test.ts`
Expected: FAIL（`tag-errors.ts` が存在しないため）

- [ ] **Step 4: テストを実行して通過することを確認**

Run: `pnpm run test src/features/tags/tag.function.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/tags/tag-errors.ts src/features/tags/tag.function.test.ts
git commit -m "feat(tags): TagNameAlreadyExistsError を ErrorFactory で定義"
```

---

### Task 2: `addTag` に重複チェックを追加

**Files:**

- Modify: `src/features/tags/tag.function.ts:41-61`

- [ ] **Step 1: `addTag` ハンドラーに重複チェックを追加**

`tag.function.ts` の先頭の import に `tagsTable` は既に import 済み。`eq` は既に import されている（`and, eq, ne, sql`）。`TagNameAlreadyExistsError` を import し、insert 前に重複を確認する。

```ts
import { createServerFn } from '@tanstack/react-start'
import { and, eq, ne, sql } from 'drizzle-orm'
import * as v from 'valibot'

import { getDB } from '../../db/index.server'
import { tagsTable } from '../../db/schema/tag'
import { offsetPaginationQuerySchema } from '../../schemas/pagination'
import { ensureSession } from '../auth/auth.function'
import { tagNameSchema } from './tag-name.schema'
import { TagNameAlreadyExistsError } from './tag-errors'
```

```ts
export const addTag = createServerFn({ method: 'POST' })
  .validator(addTagInputSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const { name } = ctx.data

    const [duplicate] = await db
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(and(eq(tagsTable.name, name), eq(tagsTable.userId, session.user.id)))
      .limit(1)

    if (duplicate != null) {
      throw new TagNameAlreadyExistsError()
    }

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

- [ ] **Step 2: 型チェック・リントを実行**

Run: `pnpm run typecheck && pnpm run lint`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/features/tags/tag.function.ts
git commit -m "feat(tags): addTag に重複チェックを追加"
```

---

### Task 3: 一覧画面の常設インライン入力コンポーネント

**Files:**

- Create: `src/features/tags/components/inline-add-tag.tsx`
- Modify: `src/routes/_protected/tags/index.tsx`

- [ ] **Step 1: インライン入力コンポーネントを作成**

```tsx
// src/features/tags/components/inline-add-tag.tsx
import { Input } from '@base-ui/react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import * as v from 'valibot'

import { addTag } from '../../tag.function'
import { TagNameAlreadyExistsError } from '../../tag-errors'
import { tagNameSchema } from '../../tag-name.schema'

export function InlineAddTag() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    let parsedName: string
    try {
      parsedName = v.parse(tagNameSchema, name)
    } catch {
      setError('タグ名を入力してください（32文字以内）')
      return
    }

    setIsPending(true)
    try {
      await addTag({ data: { name: parsedName } })
      setName('')
      await navigate({ to: '/tags', search: { limit: 50, offset: 0 } })
      await navigate({ to: '/tags', search: { limit: 50, offset: 0 } })
    } catch (e) {
      if (e instanceof TagNameAlreadyExistsError) {
        setError('そのタグ名は既に存在します')
      } else {
        setError('タグの作成に失敗しました')
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor='inline-add-tag-name'>
        新しいタグ
        <Input
          id='inline-add-tag-name'
          value={name}
          type='text'
          onValueChange={(newValue) => {
            setName(newValue)
          }}
        />
      </label>
      <button
        type='submit'
        disabled={isPending}>
        {isPending ? '追加中...' : '追加'}
      </button>
      {error != null && <p role='alert'>{error}</p>}
    </form>
  )
}
```

> 注意: `navigate` で同一ルートへ遷移させ loader を再実行（`router.invalidate` の代わり）し一覧を即反映する。2回 navigate するのは TanStack Router の loader 再実行を確実にする暫定手段。もし既存コードに `router.invalidate()` の使用例があればそちらを優先すること。

- [ ] **Step 2: 一覧画面に配置**

`src/routes/_protected/tags/index.tsx` を以下のように修正（import 追加と `RouteComponent` への配置）。

```tsx
import { createFileRoute, ErrorComponent, ErrorComponentProps } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import * as v from 'valibot'

import { ErrorFallback } from '../../../components/error-fallback'
import { ensureSession } from '../../../features/auth/auth.function'
import { TagTable } from '../../../features/tags/tag-table'
import { InlineAddTag } from '../../../features/tags/components/inline-add-tag'
import { fetchTags } from '../../../features/tags/tag.function'
import { offsetPaginationQuerySchema } from '../../../schemas/pagination'
```

```tsx
function RouteComponent() {
  const { user, tagsPromise } = Route.useLoaderData()

  return (
    <>
      <h1>{user.name}のタグ一覧</h1>
      <InlineAddTag />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<p>Loading...</p>}>
          <TagTable tagPromise={tagsPromise} />
        </Suspense>
      </ErrorBoundary>
    </>
  )
}
```

- [ ] **Step 3: 型チェック・リントを実行**

Run: `pnpm run typecheck && pnpm run lint`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/features/tags/components/inline-add-tag.tsx src/routes/_protected/tags/index.tsx
git commit -m "feat(tags): 一覧画面に常設インライン入力を追加"
```

---

### Task 4: ブックマーク入力スキーマに `tags` を追加

**Files:**

- Modify: `src/features/bookmarks/bookmark.schema.ts`
- Test: `src/features/bookmarks/bookmark.function.test.ts`

- [ ] **Step 1: スキーマに `tags` を追加**

```ts
// src/features/bookmarks/bookmark.schema.ts
import * as v from 'valibot'

export const addBookmarkInputSchema = v.object({
  url: v.pipe(v.string(), v.url()),
  title: v.string(),
  note: v.nullable(v.string()),
  tags: v.array(v.number())
})

export const updateBookmarkInputSchema = v.object({
  id: v.string(),
  url: v.pipe(v.string(), v.url()),
  title: v.string(),
  note: v.nullable(v.string()),
  tags: v.array(v.number())
})
```

- [ ] **Step 2: `addBookmarkInputSchema` を bookmark.function.ts から export する**

`bookmark.function.ts:14` の `addBookmarkInputSchema` は現在ファイル内で `v.pick` で定義されている。これを `bookmark.schema.ts` の `addBookmarkInputSchema` を使うよう変更し、export する。

`bookmark.function.ts` の先頭 import を修正:

```ts
import { addBookmarkInputSchema } from './bookmark.schema'
import { updateBookmarkInputSchema } from './bookmark.schema'
```

そして `addBookmarkInputSchema` の定義行（`:14`）を削除し、`addBookmark` の validator で `addBookmarkInputSchema` を参照するよう既存のまま維持（`export const addBookmark = createServerFn(...).validator(addBookmarkInputSchema)` はそのまま）。

- [ ] **Step 3: 失敗するテストを追加**

`src/features/bookmarks/bookmark.function.test.ts` の末尾に追加:

```ts
import { addBookmarkInputSchema, updateBookmarkInputSchema } from './bookmark.schema'

describe('addBookmarkInputSchema', () => {
  test('tags 配列を受け付ける', async () => {
    const result = await v.parseAsync(addBookmarkInputSchema, {
      url: 'https://example.com',
      title: 'Example Site',
      note: null,
      tags: [1, 2, 3]
    })

    expect(result.tags).toEqual([1, 2, 3])
  })

  test('tags がないと失敗', async () => {
    await expect(
      v.parseAsync(addBookmarkInputSchema, {
        url: 'https://example.com',
        title: 'Example Site',
        note: null
      })
    ).rejects.toThrow()
  })
})

describe('updateBookmarkInputSchema', () => {
  test('tags 配列を受け付ける', async () => {
    const result = await v.parseAsync(updateBookmarkInputSchema, {
      id: 'test-bookmark-id',
      url: 'https://example.com',
      title: 'Example Site',
      note: null,
      tags: [1]
    })

    expect(result.tags).toEqual([1])
  })
})
```

- [ ] **Step 4: テストを実行して失敗を確認**

Run: `pnpm run test src/features/bookmarks/bookmark.function.test.ts`
Expected: FAIL（`tags` が未定義のため）

- [ ] **Step 5: テストを実行して通過を確認**

Run: `pnpm run test src/features/bookmarks/bookmark.function.test.ts`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/bookmarks/bookmark.schema.ts src/features/bookmarks/bookmark.function.ts src/features/bookmarks/bookmark.function.test.ts
git commit -m "feat(bookmarks): 入力スキーマに tags 配列を追加"
```

---

### Task 5: `addBookmark`/`updateBookmark` でタグを紐付け保存

**Files:**

- Modify: `src/features/bookmarks/bookmark.function.ts`

- [ ] **Step 1: `bookmarkTagsTable` を import**

`bookmark.function.ts:6-10` 付近の import を修正:

```ts
import { getDB } from '../../db/index.server'
import { bookmarkTable, bookmarkInsertSchema } from '../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../db/schema/bookmark-tag'
import { offsetPaginationQuerySchema } from '../../schemas/pagination'
import { ensureSession } from '../auth/auth.function'
import { addBookmarkInputSchema, updateBookmarkInputSchema } from './bookmark.schema'
```

- [ ] **Step 2: `addBookmark` に紐付け保存を追加**

`bookmark.function.ts` の `addBookmark` ハンドラーを修正（`tags` を受け取り中間テーブルへ一括 insert）:

```ts
export const addBookmark = createServerFn({ method: 'POST' })
  .validator(addBookmarkInputSchema)
  .handler(async (ctx) => {
    const session = await ensureSession()
    const db = getDB()

    const id = uuidv7()
    const { url, title, note, tags } = ctx.data

    await db.insert(bookmarkTable).values({ id, url, title, note, userId: session.user.id })

    if (tags.length > 0) {
      await db.insert(bookmarkTagsTable).values(tags.map((tagId) => ({ bookmarkId: id, tagId })))
    }

    return { id }
  })
```

- [ ] **Step 3: `updateBookmark` に紐付け置換を追加**

`updateBookmark` ハンドラーの `db.update(...)` の直後に、既存紐付けを削除してから新しい tags を一括 insert する:

```ts
await db
  .update(bookmarkTable)
  .set({ url, title, note, updatedAt: new Date() })
  .where(and(eq(bookmarkTable.id, id), eq(bookmarkTable.userId, session.user.id)))

await db.delete(bookmarkTagsTable).where(eq(bookmarkTagsTable.bookmarkId, id))

if (tags.length > 0) {
  await db.insert(bookmarkTagsTable).values(tags.map((tagId) => ({ bookmarkId: id, tagId })))
}

return { id }
```

`updateBookmark` の先頭で `const { id, url, title, note } = ctx.data` を `const { id, url, title, note, tags } = ctx.data` に変更すること。

- [ ] **Step 4: 型チェック・リントを実行**

Run: `pnpm run typecheck && pnpm run lint`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/features/bookmarks/bookmark.function.ts
git commit -m "feat(bookmarks): addBookmark/updateBookmark でタグを中間テーブルに紐付け"
```

---

### Task 6: ブックマーク用タグ選択＋インライン作成コンポーネント

**Files:**

- Create: `src/features/bookmarks/components/tag-selector.tsx`

- [ ] **Step 1: タグ選択コンポーネントを作成**

```tsx
// src/features/bookmarks/components/tag-selector.tsx
import { Input } from '@base-ui/react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import * as v from 'valibot'

import type { TagSelectType } from '../../../db/schema/tag'
import { addTag } from '../../tags/tag.function'
import { TagNameAlreadyExistsError } from '../../tags/tag-errors'
import { tagNameSchema } from '../../tags/tag-name.schema'

interface TagSelectorProps {
  allTags: TagSelectType[]
  selectedTagIds: number[]
  onChange: (tagIds: number[]) => void
}

export function TagSelector({ allTags, selectedTagIds, onChange }: TagSelectorProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const filteredTags = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(query.trim().toLowerCase())
  )

  function toggleTag(tagId: number) {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  async function handleCreate() {
    setError(null)
    let parsedName: string
    try {
      parsedName = v.parse(tagNameSchema, query)
    } catch {
      setError('タグ名を入力してください（32文字以内）')
      return
    }

    setIsPending(true)
    try {
      const { id } = await addTag({ data: { name: parsedName } })
      onChange([...selectedTagIds, id])
      setQuery('')
      await navigate({ to: '/bookmarks/new', search: { tagMode: 'and', sort: 'newest' } })
    } catch (e) {
      if (e instanceof TagNameAlreadyExistsError) {
        const existing = allTags.find((tag) => tag.name === parsedName)
        if (existing != null && !selectedTagIds.includes(existing.id)) {
          onChange([...selectedTagIds, existing.id])
        }
        setError('そのタグ名は既に存在します（既存タグを選択しました）')
        setQuery('')
      } else {
        setError('タグの作成に失敗しました')
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div>
      <fieldset>
        <legend>タグ</legend>
        <div>
          {allTags.map((tag) => (
            <label key={tag.id}>
              <input
                type='checkbox'
                checked={selectedTagIds.includes(tag.id)}
                onChange={() => toggleTag(tag.id)}
              />
              {tag.name}
            </label>
          ))}
        </div>
        <Input
          id='tag-selector-query'
          value={query}
          type='text'
          placeholder='タグを絞り込む / 新規作成'
          onValueChange={(newValue) => {
            setQuery(newValue)
          }}
        />
        <button
          type='button'
          onClick={handleCreate}
          disabled={isPending}>
          {isPending ? '作成中...' : 'この名前で作成'}
        </button>
        {error != null && <p role='alert'>{error}</p>}
      </fieldset>
    </div>
  )
}
```

> 備考: `allTags` は呼び出し側（ブックマークフォーム）が `fetchTags` で取得して渡す。`navigate` による同一ルート再遷移は一覧と同様の暫定手段。

- [ ] **Step 2: 型チェック・リントを実行**

Run: `pnpm run typecheck && pnpm run lint`
Expected: エラーなし（この時点では未使用の `filteredTags` は lint で警告される可能性がある。`filteredTags` を実際に使うよう、チェックボックス一覧を `filteredTags` で描画するよう修正すること）

修正例:

```tsx
<div>
  {filteredTags.map((tag) => (
    <label key={tag.id}>
      <input
        type='checkbox'
        checked={selectedTagIds.includes(tag.id)}
        onChange={() => toggleTag(tag.id)}
      />
      {tag.name}
    </label>
  ))}
</div>
```

- [ ] **Step 3: コミット**

```bash
git add src/features/bookmarks/components/tag-selector.tsx
git commit -m "feat(bookmarks): タグ選択＋インライン作成コンポーネントを追加"
```

---

### Task 7: ブックマーク新規フォームにタグ選択を組み込み

**Files:**

- Modify: `src/routes/_protected/bookmarks/new/index.tsx`

- [ ] **Step 1: 新規フォームに TagSelector を組み込む**

`src/routes/_protected/bookmarks/new/index.tsx` を以下のように修正する。

import 追加:

```tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useActionState, useState } from 'react'
import * as v from 'valibot'

import { addBookmark } from '../../../../features/bookmarks/bookmark.function'
import { TagSelector } from '../../../../features/bookmarks/components/tag-selector'
import { fetchTags } from '../../../../features/tags/tag.function'
import type { TagSelectType } from '../../../../db/schema/tag'
```

`RouteComponent` で tags を取得し `submitAction` に渡す:

```tsx
function RouteComponent() {
  const navigate = useNavigate()
  const [allTags] = useState<TagSelectType[]>(
    // 簡易取得。loader にする場合は Route.loader で fetchTags を呼ぶよう変更してもよい
    []
  )

  async function submitAction({
    url,
    title,
    tags
  }: {
    url: string
    title: string
    tags: number[]
  }) {
    const { id } = await addBookmark({ data: { url, title, note: null, tags } })

    await navigate({
      to: '/bookmarks/$id',
      params: { id },
      state: { newBookmarkCreated: true }
    })
  }

  return (
    <div>
      <h1>ブックマーク新規作成</h1>

      <RegisterNewBookmarkForm
        allTags={allTags}
        submitAction={submitAction}
      />

      <Link
        to='/'
        search={{ tagMode: 'and', sort: 'newest' }}>
        一覧へ戻る
      </Link>
    </div>
  )
}
```

> 注: 上記の `allTags` は空配列のままだと選択UIが動かない。実運用では `Route.loader` で `fetchTags` を呼び `{ tagsPromise }` を返し、`RouteComponent` で `use(tagsPromise)` から `TagSelectType[]` を取得すること。ここでは `useState` による簡易実装を示しているが、実装時は loader 経由に置き換えること。

`RegisterNewBookmarkForm` の修正（`tags` 状態を保持し submit 時に渡す）:

```tsx
interface RegisterNewBookmarkFormProps {
  allTags: TagSelectType[]
  submitAction: (values: { url: string; title: string; tags: number[] }) => Promise<void>
}

function RegisterNewBookmarkForm({ allTags, submitAction }: RegisterNewBookmarkFormProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])

  const registerNewBookmarkFormSchema = v.object({
    url: v.pipe(v.string(), v.url()),
    title: v.string()
  })

  const registerNewBookmarkForm = useForm({
    initialInput: {
      url: '',
      title: ''
    },
    schema: registerNewBookmarkFormSchema
  })

  const [_, throwError, isPending] = useActionState(async () => {
    const currentRawUrl = getInput(registerNewBookmarkForm, { path: ['url'] }) ?? ''
    const currentRawTitle = getInput(registerNewBookmarkForm, { path: ['title'] }) ?? ''

    await submitAction({ url: currentRawUrl, title: currentRawTitle, tags: selectedTagIds })
  }, null)

  return (
    <form action={throwError}>
      <fieldset>
        <legend>ブックマーク新規登録</legend>

        <Field
          of={registerNewBookmarkForm}
          path={['url']}>
          {(field) => (
            <label htmlFor={field.props.name}>
              URL
              <Input
                id={field.props.name}
                value={field.input}
                type='url'
                onValueChange={(newValue) => field.onChange(newValue)}
                required
              />
            </label>
          )}
        </Field>

        <Field
          of={registerNewBookmarkForm}
          path={['title']}>
          {(field) => (
            <label htmlFor={field.props.name}>
              タイトル
              <Input
                id={field.props.name}
                value={field.input}
                type='text'
                onValueChange={(newValue) => field.onChange(newValue)}
                required
              />
            </label>
          )}
        </Field>
      </fieldset>

      <TagSelector
        allTags={allTags}
        selectedTagIds={selectedTagIds}
        onChange={setSelectedTagIds}
      />

      <button
        type='submit'
        disabled={isPending}>
        {isPending ? '登録中...' : '登録'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: 型チェック・リントを実行**

Run: `pnpm run typecheck && pnpm run lint`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/routes/_protected/bookmarks/new/index.tsx
git commit -m "feat(bookmarks): 新規フォームにタグ選択を組み込み"
```

---

### Task 8: ブックマーク編集フォームにタグ選択を組み込み

**Files:**

- Modify: `src/routes/_protected/bookmarks/$id/edit.tsx`

- [ ] **Step 1: 編集フォームに TagSelector を組み込む**

`src/routes/_protected/bookmarks/$id/edit.tsx` を以下のように修正する。

import 追加:

```tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useActionState, useState } from 'react'
import * as v from 'valibot'

import type { BookmarkSelectType } from '../../../../db/schema/bookmark'
import type { TagSelectType } from '../../../../db/schema/tag'
import { getBookmark, updateBookmark } from '../../../../features/bookmarks/bookmark.function'
import { TagSelector } from '../../../../features/bookmarks/components/tag-selector'
import { fetchTags } from '../../../../features/tags/tag.function'
```

`RouteComponent` で tags を取得し `submitAction` に渡す:

```tsx
function RouteComponent() {
  const { bookmark } = Route.useLoaderData()
  const navigate = useNavigate()
  const [allTags] = useState<TagSelectType[]>([])

  async function submitAction({
    url,
    title,
    note,
    tags
  }: {
    url: string
    title: string
    note: string | null
    tags: number[]
  }) {
    await updateBookmark({ data: { id: bookmark.id, url, title, note, tags } })

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
        allTags={allTags}
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
```

`EditBookmarkForm` の修正:

```tsx
interface EditBookmarkFormProps {
  bookmark: BookmarkSelectType
  allTags: TagSelectType[]
  submitAction: (values: {
    url: string
    title: string
    note: string | null
    tags: number[]
  }) => Promise<void>
}

function EditBookmarkForm({ bookmark, allTags, submitAction }: EditBookmarkFormProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])

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
    const currentRawNote = getInput(editBookmarkForm, { path: ['note'] }) ?? ''
    const note = currentRawNote === '' ? null : currentRawNote

    await submitAction({ url: currentRawUrl, title: currentRawTitle, note, tags: selectedTagIds })
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
                onValueChange={(newValue) => field.onChange(newValue)}
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
                onValueChange={(newValue) => field.onChange(newValue)}
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
                onValueChange={(newValue) => field.onChange(newValue)}
              />
            </label>
          )}
        </Field>
      </fieldset>

      <TagSelector
        allTags={allTags}
        selectedTagIds={selectedTagIds}
        onChange={setSelectedTagIds}
      />

      <button
        type='submit'
        disabled={isPending}>
        {isPending ? '更新中...' : '更新'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: 型チェック・リントを実行**

Run: `pnpm run typecheck && pnpm run lint`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/routes/_protected/bookmarks/\$id/edit.tsx
git commit -m "feat(bookmarks): 編集フォームにタグ選択を組み込み"
```

---

### Task 9: 手動確認と全体テスト

**Files:**

- なし（確認のみ）

- [ ] **Step 1: 全テストを実行**

Run: `pnpm run test`
Expected: PASS（Task 1・4 の単体テストが通過）

- [ ] **Step 2: 型チェック・リント全体**

Run: `pnpm run typecheck && pnpm run lint`
Expected: エラーなし

- [ ] **Step 3: 手動確認（開発サーバー）**

Run: `pnpm run dev`
ブラウザで以下を確認:

1. `/tags` でインライン入力に同名タグを入力 → 「そのタグ名は既に存在します」と表示される
2. 異なる名前を入力 → 一覧に即反映される
3. ブックマーク新規作成でタグを選択／その場で作成 → 保存後 `bookmark_tags` に紐付け行がある（DB または詳細画面で確認）
4. ブックマーク編集でタグを変更 → 紐付けが置換される

- [ ] **Step 4: 最終コミット（変更があれば）**

```bash
git status --short
```

変更があれば修正してコミット。なければそのまま完了。
