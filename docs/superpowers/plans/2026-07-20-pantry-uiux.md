# Pantry UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 物置メタファーのハイブリッドIA（玄関の箱＋棚ナビ＋一覧のテーブル/カード切替）と Five UI States を、既存の TanStack Start / Turso アプリに段階実装する。

**Architecture:** URL search params（`view` / `tags` / `q` / `tagMode` / `sort`）で玄関・全件一覧・棚内一覧を区別する。タグ棚データとブックマーク検索は Server Function に寄せ、純関数のソート／スキーマは Vitest、画面遷移と Five States は Playwright MCP で確認する。見た目は `src/app.css` の CSS 変数（明るいパントリー＋くすんだティール）に集約する。

**Tech Stack:** TanStack Start / Router, React 19, Valibot, Drizzle + Turso, Base UI, Vitest, Playwright MCP, CSS（kiso.css + カスタム変数）

## Global Constraints

- 仕様: `docs/superpowers/specs/2026-07-20-pantry-uiux-design.md` に従う。矛盾したら仕様を優先する。
- データ列 `pinned` / `sort_order` / `color` / `last_used_at` はマイグレーション済み（#80）。追加マイグレーションは作らない。
- ブラウザからのデータ操作は Server Function のみ。独立 HTTP API は作らない。
- Empty と Error を同じ UI にしない。Loading でレイアウトが跳ねない。
- `prefers-reduced-motion: reduce` では遷移アニメを無効化する。
- コミットは conventional commits。`.env*` と秘密情報はコミットしない。
- 各タスク完了後に `pnpm typecheck` と当該テストが通ることを確認してからコミットする。

---

## File Structure

| Path                                                   | Responsibility                                                                |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `src/routes/_protected/-lib/bookmark-search-schema.ts` | URL search: `view`, `q`, `tags`, `tagMode`, `sort`, pagination                |
| `src/features/bookmarks/bookmark-list-query.ts`        | 一覧フィルタ／ソート用の純関数・入力型（テスト容易）                          |
| `src/features/bookmarks/bookmark.function.ts`          | `fetchBookmarks` を検索対応に拡張                                             |
| `src/features/tags/tag-shelf.ts`                       | 棚／玄関用ソートと型                                                          |
| `src/features/tags/tag.function.ts`                    | `fetchShelfTags`、`touchTagLastUsed`、`updateTag` 拡張（pin/color/sortOrder） |
| `src/features/bookmarks/list-layout-preference.ts`     | テーブル/カードの localStorage 読み書き                                       |
| `src/app.css`                                          | デザイントークンと棚／箱／状態のスタイル                                      |
| `src/routes/_protected.tsx`                            | シェル: 棚ナビ + ヘッダー                                                     |
| `src/features/tags/components/shelf-nav.tsx`           | Desktop 棚ナビ / Mobile シート内容                                            |
| `src/features/tags/components/entrance-boxes.tsx`      | 玄関グリッド + Five States                                                    |
| `src/features/bookmarks/components/bookmark-list.tsx`  | 一覧（テーブル/カード）+ Five States                                          |
| `src/features/bookmarks/components/bookmark-table.tsx` | 既存テーブルを list の一部として再利用 or 吸収                                |
| `src/routes/_protected/index.tsx`                      | `view=entrance` / `view=list` の合成                                          |
| `src/routes/_protected/bookmarks/$id/index.tsx` 他     | 詳細・フォーム・タグ・設定・サインインの見た目揃え                            |
| `src/components/ui-state.tsx`                          | Loading / Empty / Error の共通枠（小さく）                                    |

---

### Task 1: URL search に `view` を追加する

**Files:**

- Modify: `src/routes/_protected/-lib/bookmark-search-schema.ts`
- Modify: `src/routes/_protected/-lib/bookmark-search-schema.test.ts`

**Interfaces:**

- Produces: `BookmarkSearchSchema` with `view: 'entrance' | 'list'` (default `'entrance'`), existing `q` / `tags` / `tagMode` / `sort`, plus `limit` / `offset` from pagination merged at route level OR included here.

- [ ] **Step 1: Write the failing tests**

`bookmark-search-schema.test.ts` に追加:

```ts
test('defaults view to entrance', async () => {
  const result = await v.parseAsync(bookmarkSearchSchema, {})
  expect(result.view).toBe('entrance')
  expect(result.tagMode).toBe('and')
  expect(result.sort).toBe('newest')
})

test('parses view=list', async () => {
  const result = await v.parseAsync(bookmarkSearchSchema, { view: 'list' })
  expect(result.view).toBe('list')
})

test('rejects invalid view', async () => {
  await expect(v.parseAsync(bookmarkSearchSchema, { view: 'grid' })).rejects.toThrow()
})
```

既存の `default values` テストも `view: 'entrance'` を期待するよう更新する。

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/routes/_protected/-lib/bookmark-search-schema.test.ts`
Expected: FAIL（`view` 未定義）

- [ ] **Step 3: Implement schema**

```ts
import * as v from 'valibot'

import { offsetPaginationQuerySchema } from '../../../schemas/pagination'

export const bookmarkSearchSchema = v.object({
  ...offsetPaginationQuerySchema.entries,
  view: v.optional(v.picklist(['entrance', 'list']), 'entrance'),
  q: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  tagMode: v.optional(v.picklist(['and', 'or']), 'and'),
  sort: v.optional(v.picklist(['newest', 'updated']), 'newest')
})

export type BookmarkSearchSchema = v.InferOutput<typeof bookmarkSearchSchema>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run src/routes/_protected/-lib/bookmark-search-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/_protected/-lib/bookmark-search-schema.ts src/routes/_protected/-lib/bookmark-search-schema.test.ts
git commit -m "feat(search): add view param for entrance vs list"
```

---

### Task 2: ブックマーク一覧クエリを検索・タグ・ソート対応にする

**Files:**

- Create: `src/features/bookmarks/bookmark-list-query.ts`
- Create: `src/features/bookmarks/bookmark-list-query.test.ts`
- Modify: `src/features/bookmarks/bookmark.function.ts`
- Modify: `src/routes/_protected/index.tsx`（loader が新入力を渡すよう最小変更。UIはまだ仮でよい）

**Interfaces:**

- Produces:
  - `export type FetchBookmarksInput = { q?: string; tagNames?: string[]; tagMode: 'and' | 'or'; sort: 'newest' | 'updated'; limit: number; offset: number }`
  - `export function normalizeListQuery(input: FetchBookmarksInput): FetchBookmarksInput`（trim `q`、空文字は undefined、tagNames を trim+lowercase+uniq）
- Consumes: `ensureSession`, Drizzle tables, `getDB`
- `fetchBookmarks` validator を `FetchBookmarksInput` 相当の Valibot スキーマに変更し、戻り値は `BookmarkSelectType[]`（削除済み除外）

- [ ] **Step 1: Write failing tests for normalizeListQuery**

```ts
import { describe, expect, test } from 'vitest'

import { normalizeListQuery } from './bookmark-list-query'

describe('normalizeListQuery', () => {
  test('trims q and drops empty', () => {
    expect(
      normalizeListQuery({
        q: '  ',
        tagMode: 'and',
        sort: 'newest',
        limit: 50,
        offset: 0
      }).q
    ).toBeUndefined()
  })

  test('normalizes tag names', () => {
    expect(
      normalizeListQuery({
        tagNames: [' React ', 'react', 'TS'],
        tagMode: 'or',
        sort: 'updated',
        limit: 50,
        offset: 0
      }).tagNames
    ).toEqual(['react', 'ts'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/features/bookmarks/bookmark-list-query.test.ts`
Expected: FAIL（module missing）

- [ ] **Step 3: Implement normalizeListQuery + fetchBookmarks**

`bookmark-list-query.ts`:

```ts
export type FetchBookmarksInput = {
  q?: string
  tagNames?: string[]
  tagMode: 'and' | 'or'
  sort: 'newest' | 'updated'
  limit: number
  offset: number
}

export function normalizeListQuery(input: FetchBookmarksInput): FetchBookmarksInput {
  const q = input.q?.trim()
  const tagNames = [
    ...new Set((input.tagNames ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean))
  ]
  return {
    ...input,
    q: q ? q : undefined,
    tagNames: tagNames.length > 0 ? tagNames : undefined
  }
}
```

`fetchBookmarks` ハンドラで `normalizeListQuery` 後:

1. `deletedAt IS NULL` かつ `userId = session.user.id`
2. `q` があるとき `title` / `url` / `note` を `LIKE %q%`（OR）
3. `tagNames` があるときタグ名で絞り込み:
   - `and`: 指定タグすべてを持つ bookmark id
   - `or`: いずれかを持つ bookmark id
4. `sort === 'newest'` → `createdAt DESC`、`'updated'` → `updatedAt DESC`
5. `limit` / `offset`

実装は既存 Drizzle スタイルに合わせ、複雑な AND は subquery / `inArray` でよい。ルート loader は search から `FetchBookmarksInput` を組み立てて渡す（`view=entrance` のときは bookmarks を取らなくてもよいが、このタスクでは list 用配線を優先）。

- [ ] **Step 4: Run unit tests + typecheck**

Run: `pnpm exec vitest run src/features/bookmarks/bookmark-list-query.test.ts && pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/bookmarks/bookmark-list-query.ts src/features/bookmarks/bookmark-list-query.test.ts src/features/bookmarks/bookmark.function.ts src/routes/_protected/index.tsx
git commit -m "feat(bookmarks): filter and sort bookmark list queries"
```

---

### Task 3: 棚用タグ取得・last_used_at・ピン/色更新

**Files:**

- Create: `src/features/tags/tag-shelf.ts`
- Create: `src/features/tags/tag-shelf.test.ts`
- Modify: `src/features/tags/tag.function.ts`
- Modify: `src/features/bookmarks/bookmark.function.ts`（add/update で選択タグの `last_used_at` を更新）

**Interfaces:**

- Produces:
  - `export type ShelfTag = { id: number; name: string; pinned: boolean; sortOrder: number; color: string | null; lastUsedAt: Date | null; bookmarkCount: number }`
  - `export function sortTagsForEntrance(tags: ShelfTag[]): ShelfTag[]`
  - `export function sortTagsForNav(tags: ShelfTag[]): ShelfTag[]`
  - Server Fn `fetchShelfTags` → `ShelfTag[]`（現ユーザー、件数付き）
  - Server Fn `touchTagLastUsed` → `{ ok: true }` input `{ id: number }`
  - `updateTag` input を `{ id, name?, pinned?, sortOrder?, color? }` に拡張（name は従来の正規化）。少なくとも `pinned` / `color` / `sortOrder` のいずれか更新可能に

- [ ] **Step 1: Write failing sort tests**

```ts
import { describe, expect, test } from 'vitest'

import { sortTagsForEntrance, sortTagsForNav, type ShelfTag } from './tag-shelf'

const base = (partial: Partial<ShelfTag> & Pick<ShelfTag, 'id' | 'name'>): ShelfTag => ({
  pinned: false,
  sortOrder: 0,
  color: null,
  lastUsedAt: null,
  bookmarkCount: 0,
  ...partial
})

describe('sortTagsForNav', () => {
  test('pinned first then sortOrder then name', () => {
    const sorted = sortTagsForNav([
      base({ id: 1, name: 'b', pinned: false, sortOrder: 0 }),
      base({ id: 2, name: 'a', pinned: true, sortOrder: 2 }),
      base({ id: 3, name: 'c', pinned: true, sortOrder: 1 })
    ])
    expect(sorted.map((t) => t.id)).toEqual([3, 2, 1])
  })
})

describe('sortTagsForEntrance', () => {
  test('pinned then lastUsedAt desc then count desc then name', () => {
    const sorted = sortTagsForEntrance([
      base({ id: 1, name: 'z', bookmarkCount: 9 }),
      base({ id: 2, name: 'a', pinned: true, bookmarkCount: 1 }),
      base({
        id: 3,
        name: 'm',
        lastUsedAt: new Date('2026-01-02'),
        bookmarkCount: 2
      }),
      base({
        id: 4,
        name: 'n',
        lastUsedAt: new Date('2026-01-03'),
        bookmarkCount: 2
      })
    ])
    expect(sorted.map((t) => t.id)).toEqual([2, 4, 3, 1])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/features/tags/tag-shelf.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement sort helpers + server functions**

- `fetchShelfTags`: tags LEFT JOIN bookmark_tags + bookmarks（`deleted_at` null のみカウント）、user スコープ。返してから `sortTagsForNav` は呼び出し側でも可。関数は未ソートの `ShelfTag[]` を返し、UI が entrance/nav 用に並べ替えてもよい。
- `touchTagLastUsed`: 所有タグの `last_used_at = now`。
- `addBookmark` / `updateBookmark` 成功後、付与した各 `tagId` の `last_used_at` を更新。
- 一覧でタグフィルタ適用時（Task 6 以降の loader/effect）でも `touchTagLastUsed` を呼ぶ。このタスクでは API のみ用意。

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm exec vitest run src/features/tags/tag-shelf.test.ts && pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/tags/tag-shelf.ts src/features/tags/tag-shelf.test.ts src/features/tags/tag.function.ts src/features/bookmarks/bookmark.function.ts
git commit -m "feat(tags): shelf query helpers and last-used updates"
```

---

### Task 4: デザイントークンと UI 状態コンポーネント

**Files:**

- Modify: `src/app.css`
- Create: `src/components/ui-state.tsx`

**Interfaces:**

- Produces: CSS variables `--pantry-bg`, `--pantry-ink`, `--pantry-line`, `--pantry-accent`, `--pantry-accent-soft`, focus ring, shelf/box utility classes
- Produces: `<UiLoading />`, `<UiEmpty title action? />`, `<UiError message onRetry? />`

- [ ] **Step 1: Add tokens and reduced-motion rules to `src/app.css`**

```css
@import 'kiso.css';

:root {
  --pantry-bg: #f7f6f3;
  --pantry-ink: #1c1b19;
  --pantry-muted: #5c5955;
  --pantry-line: #d9d4cc;
  --pantry-accent: #2f6f6a;
  --pantry-accent-soft: color-mix(in oklab, var(--pantry-accent) 14%, white);
  --pantry-focus: var(--pantry-accent);
  --pantry-radius-box: 6px;
  --duration-exit: 150ms;
  --duration-enter: 210ms;
}

body {
  margin: 0;
  background: var(--pantry-bg);
  color: var(--pantry-ink);
}

:focus-visible {
  outline: 2px solid var(--pantry-focus);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

箱・棚・スケルトン用の最小クラス（`.pantry-box`, `.pantry-shelf-item`, `.pantry-skeleton`）も同ファイルに追加する。

- [ ] **Step 2: Implement `ui-state.tsx`**

```tsx
export function UiLoading({ label = '読み込み中' }: { label?: string }) {
  return (
    <div
      className='pantry-skeleton'
      role='status'
      aria-live='polite'>
      {label}
    </div>
  )
}

export function UiEmpty({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className='pantry-empty'>
      <p>{title}</p>
      {action}
    </div>
  )
}

export function UiError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className='pantry-error'
      role='alert'>
      <p>{message}</p>
      {onRetry ? (
        <button
          type='button'
          onClick={onRetry}>
          再試行
        </button>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app.css src/components/ui-state.tsx
git commit -m "feat(ui): add pantry design tokens and five-state primitives"
```

---

### Task 5: 保護シェルと棚ナビ

**Files:**

- Modify: `src/routes/_protected.tsx`
- Create: `src/features/tags/components/shelf-nav.tsx`
- Create: `src/features/shell/protected-shell.tsx`（任意。ロジックが膨らむなら）

**Interfaces:**

- Consumes: `fetchShelfTags`, `sortTagsForNav`
- Produces: Desktop 左レール + Mobile「棚を変える」シート。先頭に「すべて」（`view=list`・tags なし）。各タグは `view=list&tags=[name]`。ロゴは `view=entrance`
- Sign out は設定へ誘導を主とし、ヘッダー末尾にコンパクト出口を残してよい

- [ ] **Step 1: Implement ShelfNav**

```tsx
// shelf-nav.tsx のリンク契約（実装時に厳密な search 型を付ける）
// Pantry → { view: 'entrance' }
// すべて → { view: 'list', tagMode: 'and', sort: 'newest' }  // tags なし
// タグ名 → { view: 'list', tags: [tag.name], tagMode: 'and', sort: 'newest' }
```

選択中ハイライト: 現在の `view` / `tags[0]` と照合。件数と色ドットを表示。タッチターゲット ≥ 44px。

- [ ] **Step 2: Wire layout in `_protected.tsx`**

loader または layout 内で `fetchShelfTags` を取得し、`ShelfNav` に渡す。Loading/Error はナビ領域内の `UiLoading` / `UiError`。既存の雑多な nav リンクはシェルに再配置（タグ管理・設定・＋新規）。

- [ ] **Step 3: Manual / Playwright smoke**

Run: `pnpm run dev` 後、デスクトップ幅で左ナビ、狭い幅でシートが使えること。
Expected: 未ログインは従来どおり sign-in。ログイン後に棚が見える。

- [ ] **Step 4: Commit**

```bash
git add src/routes/_protected.tsx src/features/tags/components/shelf-nav.tsx
git commit -m "feat(shell): add pantry shelf navigation"
```

---

### Task 6: 玄関グリッド（Entrance）

**Files:**

- Create: `src/features/tags/components/entrance-boxes.tsx`
- Modify: `src/routes/_protected/index.tsx`

**Interfaces:**

- Consumes: `fetchShelfTags`, `sortTagsForEntrance`, `UiLoading|Empty|Error`
- When `search.view === 'entrance'`, render Entrance; else List (Task 7 が来るまで仮の list でも可)

- [ ] **Step 1: Implement EntranceBoxes with Five States**

- Ideal: `sortTagsForEntrance` 結果をグリッド（色帯・名前・件数）。クリックで `view=list&tags=[name]` へ。可能なら並行して `touchTagLastUsed`
- Empty: 「まだ箱がありません」+ タグ作成 or 新規ブックマーク
- Loading: 2列スケルトン
- Error: 領域内再試行
- Partial: 全体 Loading でよい（仕様どおり）

- [ ] **Step 2: Route switch on `view`**

```tsx
const search = Route.useSearch()
if (search.view === 'entrance') {
  return <EntranceBoxes />
}
return <BookmarkList /* Task 7 */ />
```

デフォルト着陸を `view=entrance` にする（スキーマ default）。既存リンクで `search` 不足の箇所は型エラーを直す。

- [ ] **Step 3: Typecheck + vitest**

Run: `pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/tags/components/entrance-boxes.tsx src/routes/_protected/index.tsx
git commit -m "feat(home): add entrance box grid for tags"
```

---

### Task 7: 一覧（テーブル ↔ カード）と Five States

**Files:**

- Create: `src/features/bookmarks/list-layout-preference.ts`
- Create: `src/features/bookmarks/list-layout-preference.test.ts`
- Create: `src/features/bookmarks/components/bookmark-list.tsx`
- Modify: `src/features/bookmarks/components/bookmark-table.tsx`（必要なら）
- Modify: `src/routes/_protected/index.tsx`

**Interfaces:**

- Produces:
  - `export type ListLayout = 'table' | 'card'`
  - `export function readListLayout(): ListLayout`
  - `export function writeListLayout(layout: ListLayout): void`（key `pantry:listLayout:v1`）
- BookmarkList: toolbar（棚名、q、tagMode、sort、layout toggle、追加タグチップ）、Ideal/Empty/Loading/Partial/Error

- [ ] **Step 1: Tests for list layout preference**

```ts
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { readListLayout, writeListLayout } from './list-layout-preference'

describe('list-layout-preference', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v)
      },
      removeItem: (k: string) => {
        store.delete(k)
      }
    })
  })

  test('defaults to table', () => {
    expect(readListLayout()).toBe('table')
  })

  test('persists card', () => {
    writeListLayout('card')
    expect(readListLayout()).toBe('card')
  })
})
```

- [ ] **Step 2: Implement preference + BookmarkList**

- loader: `view=list` のとき `fetchBookmarks` + 必要なら shelf tags
- 初回 Loading: テーブル/カード形スケルトン
- Empty: 棚が空 vs 検索0件で文言分岐
- Partial: 「さらに読み込む」で offset += limit。失敗時は末尾エラーで既存行維持
- タグで開いたとき `touchTagLastUsed` を1回呼ぶ
- 行/カードはキーボード操作可能（リンク）

- [ ] **Step 3: Run tests**

Run: `pnpm exec vitest run src/features/bookmarks/list-layout-preference.test.ts && pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/bookmarks/list-layout-preference.ts src/features/bookmarks/list-layout-preference.test.ts src/features/bookmarks/components/bookmark-list.tsx src/features/bookmarks/components/bookmark-table.tsx src/routes/_protected/index.tsx
git commit -m "feat(bookmarks): table/card list with five UI states"
```

---

### Task 8: 詳細・登録・編集のビジュアルと状態

**Files:**

- Modify: `src/routes/_protected/bookmarks/$id/index.tsx`
- Modify: `src/routes/_protected/bookmarks/$id/edit.tsx`
- Modify: `src/routes/_protected/bookmarks/new/index.tsx`

**Interfaces:**

- 詳細: 余白多め Ideal / Loading skeleton / Error retry / not found → 一覧（`view=list` と可能なら tags コンテキスト維持）
- フォーム: タイトル取得 Loading でボタン disabled、失敗時も入力維持（Partial）、保存中の二重送信防止
- 「一覧へ」は `view=list` + 直前の tags があればそれを search に載せる

- [ ] **Step 1: Detail page states and spacing**

詳細ルートをトークンに合わせ、削除確認ダイアログのラベルを明確化。戻るリンクの search を保持。

- [ ] **Step 2: New/Edit form states**

タイトル取得・保存の pending UI。エラーはフィールド下 + フォーム上部要約。主CTAはアクセント1つ。

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/routes/_protected/bookmarks
git commit -m "feat(bookmarks): polish detail and form UI states"
```

---

### Task 9: タグ管理・設定・サインインの磨き込み

**Files:**

- Modify: `src/routes/_protected/tags/index.tsx`
- Modify: `src/routes/_protected/tags/new.tsx`
- Modify: `src/routes/_protected/tags/$id.edit.tsx`
- Modify: `src/routes/_protected/tags/$id/index.tsx`
- Modify: `src/routes/_protected/settings/index.tsx`
- Modify: `src/routes/sign-in/index.tsx`
- Modify: `src/routes/sign-in/-components/sign-in-with-email-and-password-form.tsx`
- Modify: `src/features/tags/tag-table.tsx`

**Interfaces:**

- タグ一覧行: 色・名前・件数・ピン。行クリック推奨は `view=list&tags=[name]`
- タグ編集: name + pinned toggle + color palette（固定数のスウォッチ配列をモジュール定数で持つ）
- 設定: アカウント表示 + Sign out（主）
- サインイン: Pantry 銘板 + 短い一文 + フォーム Five States（Loading/Error）

- [ ] **Step 1: Tag admin UI wired to updateTag**

ピンと色を保存できる最小UI。並び替え DnD は YAGNI（`sortOrder` 数値入力または ± で十分ならそれでよい。DnD は入れない）。

- [ ] **Step 2: Settings + Sign-in visual pass**

仕様のコピーに合わせる。自己登録導線は出さない。

- [ ] **Step 3: Typecheck + unit tests**

Run: `pnpm test && pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/routes/_protected/tags src/routes/_protected/settings src/routes/sign-in src/features/tags
git commit -m "feat(ui): polish tags, settings, and sign-in"
```

---

### Task 10: モーションと受け入れ確認

**Files:**

- Modify: `src/app.css`（view-transition recipes if used）
- Modify: relevant route components to wrap with React `<ViewTransition>` where the project React version supports it; otherwise CSS-only transitions on entrance→list

**Interfaces:**

- 玄関→一覧: 短いフェード＋わずかな translateY
- 棚切替: メインのみクロスフェード
- テーブル↔カード: 短いクロスフェード
- reduced-motion で無効（Task 4 の media query）

- [ ] **Step 1: Add transition hooks without breaking SSR**

サポート状況を確認し、使えるなら `ViewTransition` + `default="none"`。使えなければ class ベースの軽い CSS transition に落とす。

- [ ] **Step 2: Playwright MCP acceptance checklist**

仕様と `docs/testing.md` に沿い、少なくとも次を確認する:

1. サインイン → 玄関 → 箱タップ → 一覧 → 詳細 → 戻る（棚コンテキスト維持）
2. テーブル ↔ カード切替がリロード後も保持
3. 検索0件と棚が空で文言が違う
4. 追加読み込み失敗時に既存行が残る（可能なら Network 遮断で模擬）
5. モバイル幅で棚シート操作
6. キーボードで箱・一覧行へ到達

- [ ] **Step 3: Final verification**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: all success

- [ ] **Step 4: Commit**

```bash
git add src/app.css src/routes src/features src/components
git commit -m "feat(ui): add pantry motion and finish acceptance polish"
```

---

## Spec coverage checklist

| Spec area                             | Task                             |
| ------------------------------------- | -------------------------------- |
| `view` で玄関/一覧/すべてを区別       | 1, 5, 6, 7                       |
| ハイブリッド棚ナビ＋箱                | 5, 6                             |
| 一覧テーブル↔カード + localStorage    | 7                                |
| 検索・タグ AND/OR・ソート・ページング | 2, 7                             |
| `last_used_at` / pinned / color 利用  | 3, 6, 9                          |
| Five UI States                        | 4, 6, 7, 8, 9                    |
| ビジュアル（パントリー＋ティール）    | 4                                |
| 詳細余白・フォーム Partial            | 8                                |
| タグ管理・設定・サインイン            | 9                                |
| モーション + a11y 受け入れ            | 10                               |
| 未整理棚                              | Out of scope（仕様どおり後続可） |
| favicon/OG・タグ階層                  | Out of scope                     |

## Execution notes

- 推奨 PR 分割: Tasks 1–3（データ）→ 4–7（シェル＋玄関＋一覧）→ 8–10（磨き込み）。
- 孤立 worktree で実行する場合は `superpowers:using-git-worktrees` を先に使う。
- DB 結合テスト基盤が無いため、クエリの正しさは純関数 + Playwright で担保する。後続で libsql メモリDBテストを足してもよいが本計画の必須ではない。
