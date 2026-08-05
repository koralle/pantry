# Lucide React アイコン一括導入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** テキストのみの全画面 UI に lucide-react アイコンを一括導入し、既存テキストは併記したまま装飾アイコン（`aria-hidden`）を添える。

**Architecture:** 各ファイルで lucide-react コンポーネントを直接 import し、JSX に挿入する。ラッパーコンポーネントは作らない。既存のボタン・リンクは既に `inline-flex; align-items: center` のためレイアウト変更はほぼ不要。ローダーの spin とスウォッチ・ブランドの中央揃えのみ app.css に少量追加する。

**Tech Stack:** React 19, TanStack Start/Router, lucide-react, CSS (app.css), Vitest / oxlint / tsgo

**Spec:** `docs/superpowers/specs/2026-07-21-lucide-react-icons-design.md`

**Conventions（全タスク共通）:**

- アイコンは基本 `size={16}`。強調（見出し・空状態）は `size={20}`。チップ・テーブルセル等の小さい文脈は `size={14}`。
- テキストが必ず併記されるため、全アイコンに `aria-hidden` を付ける。
- アイコン名は `lucide-react` の現行名（`TriangleAlert`, `CircleCheck`, `CircleAlert`, `LoaderCircle` 等）。存在は確認済み。
- コミットは Conventional Commits（`feat(ui): ...`）。

---

## File Structure

| ファイル                                                                  | 変更内容                                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `src/app.css`                                                             | spinner keyframe、スウォッチ中央揃え、サインインブランド flex |
| `src/components/ui-state.tsx`                                             | UiLoading/UiEmpty/UiError にアイコン                          |
| `src/components/error-fallback.tsx`                                       | ErrorFallback に TriangleAlert                                |
| `src/routes/_protected.tsx`                                               | シェル（新規/設定/ログアウト/棚切替/閉じる/タグ管理）         |
| `src/features/bookmarks/components/bookmark-list.tsx`                     | ツールバー・チップ・読み込み                                  |
| `src/features/bookmarks/components/bookmark-table.tsx`                    | URL カラムに Globe                                            |
| `src/features/tags/components/entrance-boxes.tsx`                         | 玄関ボックス・空状態                                          |
| `src/features/tags/tag-table.tsx`                                         | ピン列・編集                                                  |
| `src/features/tags/components/tag-edit-fields.tsx`                        | ピントグル・ステッパー・スウォッチ                            |
| `src/features/tags/components/inline-add-tag.tsx`                         | 追加ボタン                                                    |
| `src/routes/_protected/bookmarks/$id/index.tsx`                           | 詳細（戻る/フラッシュ/URL/編集/削除/キャンセル）              |
| `src/routes/_protected/bookmarks/$id/edit.tsx`                            | 編集ワークベンチ（戻るリンク）                                |
| `src/routes/_protected/bookmarks/new/index.tsx`                           | 新規ワークベンチ（戻るリンク）                                |
| `src/routes/_protected/bookmarks/-components/bookmark-workbench-form.tsx` | エラーサマリー・タイトル取得                                  |
| `src/routes/_protected/tags/index.tsx`                                    | 新規タグリンク                                                |
| `src/routes/_protected/tags/new.tsx`                                      | 戻る・エラーサマリー                                          |
| `src/routes/_protected/tags/$id.edit.tsx`                                 | 戻る・エラーサマリー                                          |
| `src/routes/_protected/tags/$id/index.tsx`                                | フラッシュ・戻る・ピン状態・編集                              |
| `src/routes/sign-in/index.tsx`                                            | ブランド Package                                              |
| `src/routes/sign-in/-components/sign-in-with-email-and-password-form.tsx` | Mail/Lock/LogIn/CircleAlert                                   |
| `src/routes/_protected/settings/index.tsx`                                | ログアウト・玄関へ戻る                                        |

---

## Task 1: CSS 土台（spinner・スウォッチ・ブランド）

**Files:**

- Modify: `src/app.css`

- [ ] **Step 1: spinner keyframe と `.pantry-spinner` を追加**

`src/app.css` の `@keyframes pantry-skeleton-pulse { ... }` ブロック（約331-339行目）の直後に追加する:

```css
.pantry-spinner {
  animation: pantry-spin 1s linear infinite;
}

@keyframes pantry-spin {
  to {
    transform: rotate(360deg);
  }
}
```

- [ ] **Step 2: カラーパレットスウォッチを中央揃えにする**

`.pantry-color-swatch { ... }` ルール（約997-1004行目）に `display`/`align-items`/`justify-content` を追加し、次と同じにする:

```css
.pantry-color-swatch {
  inline-size: 2.75rem;
  block-size: 2.75rem;
  border-radius: var(--pantry-radius-box);
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 3: サインインブランドを flex にする**

`.pantry-sign-in__brand { ... }` ルール（約1157-1162行目）に flex を追加し、次と同じにする:

```css
.pantry-sign-in__brand {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
```

- [ ] **Step 4: 既存スタイルと衝突しないことを確認**

Run: `pnpm run lint`
Expected: エラーなし（CSS は oxlint 対象外だが、構文崩れがないことを確認するため通す）

- [ ] **Step 5: コミット**

```bash
git add src/app.css
git commit -m "feat(ui): add icon groundwork styles (spinner, swatch center, brand flex)"
```

---

## Task 2: 共通ステートコンポーネント

**Files:**

- Modify: `src/components/ui-state.tsx`
- Modify: `src/components/error-fallback.tsx`

- [ ] **Step 1: `ui-state.tsx` にアイコンを追加**

`src/components/ui-state.tsx` を次で置き換える:

```tsx
import { LoaderCircle, PackageOpen, RefreshCw, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

export function UiLoading({ label = '読み込み中' }: { label?: string }) {
  return (
    <output
      className='pantry-skeleton'
      aria-live='polite'>
      <LoaderCircle
        size={16}
        className='pantry-spinner'
        aria-hidden
      />{' '}
      {label}
    </output>
  )
}

export function UiEmpty({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className='pantry-empty'>
      <PackageOpen
        size={20}
        aria-hidden
      />
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
      <TriangleAlert
        size={20}
        aria-hidden
      />
      <p>{message}</p>
      {onRetry ? (
        <button
          type='button'
          onClick={onRetry}>
          <RefreshCw
            size={16}
            aria-hidden
          />{' '}
          再試行
        </button>
      ) : undefined}
    </div>
  )
}
```

- [ ] **Step 2: `error-fallback.tsx` にアイコンを追加**

`src/components/error-fallback.tsx` を次で置き換える:

```tsx
import { TriangleAlert } from 'lucide-react'
import { FallbackProps, getErrorMessage } from 'react-error-boundary'

export function ErrorFallback({ error }: FallbackProps) {
  return (
    <div role='alert'>
      <TriangleAlert
        size={20}
        aria-hidden
      />
      <p>{getErrorMessage(error)}</p>
    </div>
  )
}
```

- [ ] **Step 3: テスト・型チェック**

Run: `pnpm run test && pnpm run typecheck`
Expected: 全テスト PASS、型エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/components/ui-state.tsx src/components/error-fallback.tsx
git commit -m "feat(ui): add icons to shared state components"
```

---

## Task 3: アプリシェル

**Files:**

- Modify: `src/routes/_protected.tsx`

- [ ] **Step 1: import を追加**

`src/routes/_protected.tsx` 先頭の import 群に追加する（既存 import の後、相対 import の前）:

```tsx
import { LogOut, Menu, Plus, Settings, Tags, X } from 'lucide-react'
```

- [ ] **Step 2: サイドバーの「タグ管理」リンクに Tags アイコン**

次を探す:

```tsx
<Link
  to='/tags'
  search={{ limit: 50, offset: 0 }}>
  タグ管理
</Link>
```

次で置き換える:

```tsx
<Link
  to='/tags'
  search={{ limit: 50, offset: 0 }}>
  <Tags
    size={16}
    aria-hidden
  />{' '}
  タグ管理
</Link>
```

- [ ] **Step 3: サイドバーの「設定」リンクに Settings アイコン**

次を探す:

```tsx
<Link to='/settings'>設定</Link>
```

次で置き換える:

```tsx
<Link to='/settings'>
  <Settings
    size={16}
    aria-hidden
  />{' '}
  設定
</Link>
```

- [ ] **Step 4: モバイル「棚を変える」トリガーに Menu アイコン**

次を探す:

```tsx
<Dialog.Trigger className='pantry-shelf-changer'>棚を変える</Dialog.Trigger>
```

次で置き換える:

```tsx
<Dialog.Trigger className='pantry-shelf-changer'>
  <Menu
    size={16}
    aria-hidden
  />{' '}
  棚を変える
</Dialog.Trigger>
```

- [ ] **Step 5: シート「閉じる」に X アイコン**

次を探す:

```tsx
<Dialog.Close className='pantry-shelf-sheet__close'>閉じる</Dialog.Close>
```

次で置き換える:

```tsx
<Dialog.Close className='pantry-shelf-sheet__close'>
  <X
    size={16}
    aria-hidden
  />{' '}
  閉じる
</Dialog.Close>
```

- [ ] **Step 6: ヘッダー「＋新規」を Plus アイコンに置換**

次を探す:

```tsx
              }}>
              ＋新規
            </Link>
```

次で置き換える:

```tsx
              }}>
              <Plus
                size={16}
                aria-hidden
              />{' '}
              新規
            </Link>
```

- [ ] **Step 7: ヘッダー「設定」リンクに Settings アイコン**

次を探す:

```tsx
            <Link to='/settings'>設定</Link>
            <button
```

次で置き換える:

```tsx
            <Link to='/settings'>
              <Settings
                size={16}
                aria-hidden
              />{' '}
              設定
            </Link>
            <button
```

- [ ] **Step 8: ヘッダー「ログアウト」に LogOut アイコン**

次を探す:

```tsx
              disabled={isPending}>
              ログアウト
            </button>
```

次で置き換える:

```tsx
              disabled={isPending}>
              <LogOut
                size={16}
                aria-hidden
              />{' '}
              ログアウト
            </button>
```

- [ ] **Step 9: テスト・型チェック**

Run: `pnpm run test && pnpm run typecheck`
Expected: 全テスト PASS、型エラーなし

- [ ] **Step 10: コミット**

```bash
git add src/routes/_protected.tsx
git commit -m "feat(ui): add icons to app shell header and sidebar"
```

---

## Task 4: ブックマーク一覧

**Files:**

- Modify: `src/features/bookmarks/components/bookmark-list.tsx`

- [ ] **Step 1: import を追加**

`src/features/bookmarks/components/bookmark-list.tsx` の import 群に追加:

```tsx
import { ChevronDown, LayoutGrid, List, Plus, Search, X } from 'lucide-react'
```

- [ ] **Step 2: タイトル行「新規」リンクに Plus**

次を探す:

```tsx
          className='pantry-list-toolbar__new'>
          新規
        </Link>
```

次で置き換える:

```tsx
          className='pantry-list-toolbar__new'>
          <Plus
            size={16}
            aria-hidden
          />{' '}
          新規
        </Link>
```

- [ ] **Step 3: 検索ボタンに Search**

次を探す:

```tsx
<button type='submit'>検索</button>
```

次で置き換える:

```tsx
<button type='submit'>
  <Search
    size={16}
    aria-hidden
  />{' '}
  検索
</button>
```

- [ ] **Step 4: レイアウト切替「テーブル」に List**

次を探す:

```tsx
            onClick={() => {
              onLayoutChange('table')
            }}>
            テーブル
          </button>
```

次で置き換える:

```tsx
            onClick={() => {
              onLayoutChange('table')
            }}>
            <List
              size={16}
              aria-hidden
            />{' '}
            テーブル
          </button>
```

- [ ] **Step 5: レイアウト切替「カード」に LayoutGrid**

次を探す:

```tsx
            onClick={() => {
              onLayoutChange('card')
            }}>
            カード
          </button>
```

次で置き換える:

```tsx
            onClick={() => {
              onLayoutChange('card')
            }}>
            <LayoutGrid
              size={16}
              aria-hidden
            />{' '}
            カード
          </button>
```

- [ ] **Step 6: タグチップの `×` を X アイコンに置換**

次を探す:

```tsx
            {tagName}
            <span aria-hidden='true'> ×</span>
            <span className='pantry-sr-only'>を外す</span>
```

次で置き換える:

```tsx
            {tagName}
            <X
              size={14}
              aria-hidden
            />
            <span className='pantry-sr-only'>を外す</span>
```

- [ ] **Step 7: 「さらに読み込む」に ChevronDown**

次を探す:

```tsx
              onClick={loadMore}>
              {isLoadingMore ? '読み込み中…' : 'さらに読み込む'}
            </button>
```

次で置き換える:

```tsx
              onClick={loadMore}>
              <ChevronDown
                size={16}
                aria-hidden
              />{' '}
              {isLoadingMore ? '読み込み中…' : 'さらに読み込む'}
            </button>
```

- [ ] **Step 8: テスト・型チェック**

Run: `pnpm run test && pnpm run typecheck`
Expected: 全テスト PASS、型エラーなし

- [ ] **Step 9: コミット**

```bash
git add src/features/bookmarks/components/bookmark-list.tsx
git commit -m "feat(ui): add icons to bookmark list toolbar and chips"
```

---

## Task 5: ブックマークテーブル

**Files:**

- Modify: `src/features/bookmarks/components/bookmark-table.tsx`

- [ ] **Step 1: import を追加**

`src/features/bookmarks/components/bookmark-table.tsx` の import 群に追加:

```tsx
import { Globe } from 'lucide-react'
```

- [ ] **Step 2: URL カラムのリンクに Globe**

次を探す:

```tsx
                className='pantry-bookmark-row-link pantry-bookmark-row-link--muted'>
                {shortenUrl(bookmark.url, 48)}
              </Link>
```

次で置き換える:

```tsx
                className='pantry-bookmark-row-link pantry-bookmark-row-link--muted'>
                <Globe
                  size={14}
                  aria-hidden
                />{' '}
                {shortenUrl(bookmark.url, 48)}
              </Link>
```

- [ ] **Step 3: テスト・型チェック**

Run: `pnpm run test && pnpm run typecheck`
Expected: 全テスト PASS、型エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/features/bookmarks/components/bookmark-table.tsx
git commit -m "feat(ui): add globe icon to bookmark table url column"
```

---

## Task 6: 玄関ボックス

**Files:**

- Modify: `src/features/tags/components/entrance-boxes.tsx`

- [ ] **Step 1: import を追加**

`src/features/tags/components/entrance-boxes.tsx` の import 群に追加:

```tsx
import { Package, Plus } from 'lucide-react'
```

- [ ] **Step 2: 空状態アクションに Plus**

次を探す:

```tsx
<div className='pantry-entrance-empty-actions'>
  <Link to='/tags/new'>タグを作成</Link>
  <Link to='/bookmarks/new'>新規ブックマーク</Link>
</div>
```

次で置き換える:

```tsx
<div className='pantry-entrance-empty-actions'>
  <Link to='/tags/new'>
    <Plus
      size={16}
      aria-hidden
    />{' '}
    タグを作成
  </Link>
  <Link to='/bookmarks/new'>
    <Plus
      size={16}
      aria-hidden
    />{' '}
    新規ブックマーク
  </Link>
</div>
```

- [ ] **Step 3: 各ボックスの名前に Package**

次を探す:

```tsx
<span className='pantry-entrance-box__name'>{tag.name}</span>
```

次で置き換える:

```tsx
<span className='pantry-entrance-box__name'>
  <Package
    size={16}
    aria-hidden
  />{' '}
  {tag.name}
</span>
```

- [ ] **Step 4: テスト・型チェック**

Run: `pnpm run test && pnpm run typecheck`
Expected: 全テスト PASS、型エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/features/tags/components/entrance-boxes.tsx
git commit -m "feat(ui): add package icons to entrance boxes"
```

---

## Task 7: タグ管理

**Files:**

- Modify: `src/features/tags/tag-table.tsx`
- Modify: `src/features/tags/components/tag-edit-fields.tsx`
- Modify: `src/features/tags/components/inline-add-tag.tsx`
- Modify: `src/routes/_protected/tags/index.tsx`

- [ ] **Step 1: `tag-table.tsx` に import を追加**

`src/features/tags/tag-table.tsx` の import 群に追加:

```tsx
import { Pencil, Pin } from 'lucide-react'
```

- [ ] **Step 2: ピン列を Pin アイコンに置換**

`tag-table.tsx` で次を探す:

```tsx
{
  tag.pinned ? (
    <span aria-label='ピン留め中'>ピン</span>
  ) : (
    <span className='pantry-tag-table__muted'>—</span>
  )
}
```

次で置き換える:

```tsx
{
  tag.pinned ? (
    <span>
      <Pin
        size={16}
        aria-hidden
      />
      <span className='pantry-sr-only'>ピン留め中</span>
    </span>
  ) : (
    <span className='pantry-tag-table__muted'>—</span>
  )
}
```

- [ ] **Step 3: 「編集」リンクに Pencil**

`tag-table.tsx` で次を探す:

```tsx
                className='pantry-text-link'>
                編集
              </Link>
```

次で置き換える:

```tsx
                className='pantry-text-link'>
                <Pencil
                  size={16}
                  aria-hidden
                />{' '}
                編集
              </Link>
```

- [ ] **Step 4: `tag-edit-fields.tsx` に import を追加**

`src/features/tags/components/tag-edit-fields.tsx` の import 群に追加:

```tsx
import { Check, Minus, Pin, PinOff, Plus } from 'lucide-react'
```

- [ ] **Step 5: ピントグルに Pin/PinOff**

`tag-edit-fields.tsx` で次を探す:

```tsx
          {pinLabel(pinned)}
        </button>
```

次で置き換える:

```tsx
          {pinned ? (
            <PinOff
              size={16}
              aria-hidden
            />
          ) : (
            <Pin
              size={16}
              aria-hidden
            />
          )}{' '}
          {pinLabel(pinned)}
        </button>
```

- [ ] **Step 6: 選択中スウォッチに Check**

`tag-edit-fields.tsx` で次を探す:

```tsx
                aria-pressed={selected}
                aria-label={`色 ${swatch}`}
                onClick={() => {
                  onColorChange(swatch)
                }}
              />
```

次で置き換える:

```tsx
                aria-pressed={selected}
                aria-label={`色 ${swatch}`}
                onClick={() => {
                  onColorChange(swatch)
                }}>
                {selected ? (
                  <Check
                    size={16}
                    color='#fff'
                    aria-hidden
                  />
                ) : null}
              </button>
```

- [ ] **Step 7: 並び順ステッパーの `−` を Minus に置換**

`tag-edit-fields.tsx` で次を探す:

```tsx
            onClick={() => {
              onSortOrderChange(sortOrder - 1)
            }}>
            −
          </button>
```

次で置き換える:

```tsx
            onClick={() => {
              onSortOrderChange(sortOrder - 1)
            }}>
            <Minus
              size={16}
              aria-hidden
            />
          </button>
```

- [ ] **Step 8: 並び順ステッパーの `＋` を Plus に置換**

`tag-edit-fields.tsx` で次を探す:

```tsx
            onClick={() => {
              onSortOrderChange(sortOrder + 1)
            }}>
            ＋
          </button>
```

次で置き換える:

```tsx
            onClick={() => {
              onSortOrderChange(sortOrder + 1)
            }}>
            <Plus
              size={16}
              aria-hidden
            />
          </button>
```

- [ ] **Step 9: `inline-add-tag.tsx` に import と Plus**

`src/features/tags/components/inline-add-tag.tsx` の import 群に追加:

```tsx
import { Plus } from 'lucide-react'
```

次を探す:

```tsx
            disabled={isPending}>
            {isPending ? '追加中...' : '追加'}
          </button>
```

次で置き換える:

```tsx
            disabled={isPending}>
            <Plus
              size={16}
              aria-hidden
            />{' '}
            {isPending ? '追加中...' : '追加'}
          </button>
```

- [ ] **Step 10: `tags/index.tsx` に import と Plus**

`src/routes/_protected/tags/index.tsx` の import 群に追加:

```tsx
import { Plus } from 'lucide-react'
```

次を探す:

```tsx
          className='pantry-button pantry-button--accent'>
          新規タグ
        </Link>
```

次で置き換える:

```tsx
          className='pantry-button pantry-button--accent'>
          <Plus
            size={16}
            aria-hidden
          />{' '}
          新規タグ
        </Link>
```

- [ ] **Step 11: テスト・型チェック**

Run: `pnpm run test && pnpm run typecheck`
Expected: 全テスト PASS、型エラーなし

- [ ] **Step 12: コミット**

```bash
git add src/features/tags/tag-table.tsx src/features/tags/components/tag-edit-fields.tsx src/features/tags/components/inline-add-tag.tsx src/routes/_protected/tags/index.tsx
git commit -m "feat(ui): add icons to tag management screens"
```

---

## Task 8: ブックマーク詳細・編集

**Files:**

- Modify: `src/routes/_protected/bookmarks/$id/index.tsx`
- Modify: `src/routes/_protected/bookmarks/$id/edit.tsx`
- Modify: `src/routes/_protected/bookmarks/new/index.tsx`

- [ ] **Step 1: `$id/index.tsx` に import を追加**

`src/routes/_protected/bookmarks/$id/index.tsx` の import 群に追加:

```tsx
import { ArrowLeft, CircleCheck, ExternalLink, Pencil, Trash2, X } from 'lucide-react'
```

- [ ] **Step 2: 登録フラッシュに CircleCheck**

次を探す:

```tsx
          role='alert'>
          ブックマークを登録しました
        </div>
```

次で置き換える:

```tsx
          role='alert'>
          <CircleCheck
            size={16}
            aria-hidden
          />{' '}
          ブックマークを登録しました
        </div>
```

- [ ] **Step 3: 更新フラッシュに CircleCheck**

次を探す:

```tsx
          role='alert'>
          ブックマークを更新しました
        </div>
```

次で置き換える:

```tsx
          role='alert'>
          <CircleCheck
            size={16}
            aria-hidden
          />{' '}
          ブックマークを更新しました
        </div>
```

- [ ] **Step 4: 「一覧へ戻る」ナビに ArrowLeft**

次を探す:

```tsx
          className='pantry-text-link'>
          一覧へ戻る
        </Link>
      </nav>
```

次で置き換える:

```tsx
          className='pantry-text-link'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </Link>
      </nav>
```

- [ ] **Step 5: 外部 URL リンクに ExternalLink**

次を探す:

```tsx
          className='pantry-detail__url'>
          {bookmark.url}
        </a>
```

次で置き換える:

```tsx
          className='pantry-detail__url'>
          {bookmark.url}{' '}
          <ExternalLink
            size={14}
            aria-hidden
          />
        </a>
```

- [ ] **Step 6: 「編集」アクションに Pencil**

次を探す:

```tsx
          className='pantry-button pantry-button--accent'>
          編集
        </Link>
```

次で置き換える:

```tsx
          className='pantry-button pantry-button--accent'>
          <Pencil
            size={16}
            aria-hidden
          />{' '}
          編集
        </Link>
```

- [ ] **Step 7: 「削除」トリガーに Trash2**

次を探す:

```tsx
            disabled={isDeleting}>
            削除
          </Dialog.Trigger>
```

次で置き換える:

```tsx
            disabled={isDeleting}>
            <Trash2
              size={16}
              aria-hidden
            />{' '}
            削除
          </Dialog.Trigger>
```

- [ ] **Step 8: ダイアログ「キャンセル」に X**

次を探す:

```tsx
                  disabled={isDeleting}>
                  キャンセル
                </Dialog.Close>
```

次で置き換える:

```tsx
                  disabled={isDeleting}>
                  <X
                    size={16}
                    aria-hidden
                  />{' '}
                  キャンセル
                </Dialog.Close>
```

- [ ] **Step 9: ダイアログ「削除を確認」に Trash2**

次を探す:

```tsx
                  disabled={isDeleting}>
                  {isDeleting ? '削除中…' : '削除を確認'}
                </button>
```

次で置き換える:

```tsx
                  disabled={isDeleting}>
                  <Trash2
                    size={16}
                    aria-hidden
                  />{' '}
                  {isDeleting ? '削除中…' : '削除を確認'}
                </button>
```

- [ ] **Step 10: `$id/edit.tsx` に import と戻るリンク2件**

`src/routes/_protected/bookmarks/$id/edit.tsx` の import 群に追加:

```tsx
import { ArrowLeft } from 'lucide-react'
```

次を探す:

```tsx
          className='pantry-text-link'>
          詳細へ戻る
        </Link>
```

次で置き換える:

```tsx
          className='pantry-text-link'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          詳細へ戻る
        </Link>
```

次を探す:

```tsx
          className='pantry-text-link'>
          一覧へ戻る
        </Link>
      </nav>
```

次で置き換える:

```tsx
          className='pantry-text-link'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </Link>
      </nav>
```

- [ ] **Step 11: `new/index.tsx` に import と戻るリンク**

`src/routes/_protected/bookmarks/new/index.tsx` の import 群に追加:

```tsx
import { ArrowLeft } from 'lucide-react'
```

次を探す:

```tsx
          className='pantry-text-link'>
          一覧へ戻る
        </Link>
      </nav>
```

次で置き換える:

```tsx
          className='pantry-text-link'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </Link>
      </nav>
```

- [ ] **Step 12: テスト・型チェック**

Run: `pnpm run test && pnpm run typecheck`
Expected: 全テスト PASS、型エラーなし

- [ ] **Step 13: コミット**

```bash
git add "src/routes/_protected/bookmarks/\$id/index.tsx" "src/routes/_protected/bookmarks/\$id/edit.tsx" src/routes/_protected/bookmarks/new/index.tsx
git commit -m "feat(ui): add icons to bookmark detail and workbench nav"
```

---

## Task 9: ワークベンチフォーム

**Files:**

- Modify: `src/routes/_protected/bookmarks/-components/bookmark-workbench-form.tsx`

- [ ] **Step 1: `bookmark-workbench-form.tsx` に import を追加**

`src/routes/_protected/bookmarks/-components/bookmark-workbench-form.tsx` の import 群に追加:

```tsx
import { CircleAlert, Download } from 'lucide-react'
```

- [ ] **Step 2: フォームエラーサマリーに CircleAlert**

次を探す:

```tsx
          aria-live='polite'>
          <p>次を確認してください</p>
```

次で置き換える:

```tsx
          aria-live='polite'>
          <p>
            <CircleAlert
              size={16}
              aria-hidden
            />{' '}
            次を確認してください
          </p>
```

- [ ] **Step 3: 「タイトルを取得」に Download**

次を探す:

```tsx
                  disabled={busy}>
                  {isFetchingTitle ? '取得中…' : 'タイトルを取得'}
                </button>
```

次で置き換える:

```tsx
                  disabled={busy}>
                  <Download
                    size={16}
                    aria-hidden
                  />{' '}
                  {isFetchingTitle ? '取得中…' : 'タイトルを取得'}
                </button>
```

- [ ] **Step 4: テスト・型チェック**

Run: `pnpm run test && pnpm run typecheck`
Expected: 全テスト PASS、型エラーなし

- [ ] **Step 5: コミット**

```bash
git add "src/routes/_protected/bookmarks/-components/bookmark-workbench-form.tsx"
git commit -m "feat(ui): add icons to workbench form"
```

---

## Task 10: タグワークベンチ・タグ詳細

**Files:**

- Modify: `src/routes/_protected/tags/new.tsx`
- Modify: `src/routes/_protected/tags/$id.edit.tsx`
- Modify: `src/routes/_protected/tags/$id/index.tsx`

- [ ] **Step 1: `tags/new.tsx` に import を追加**

`src/routes/_protected/tags/new.tsx` の import 群に追加:

```tsx
import { ArrowLeft, CircleAlert } from 'lucide-react'
```

- [ ] **Step 2: 戻るリンクに ArrowLeft**

`tags/new.tsx` で次を探す:

```tsx
          className='pantry-text-link'>
          一覧へ戻る
        </Link>
      </nav>
```

次で置き換える:

```tsx
          className='pantry-text-link'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </Link>
      </nav>
```

- [ ] **Step 3: エラーサマリーに CircleAlert**

`tags/new.tsx` で次を探す:

```tsx
          aria-live='polite'>
          <p>{formError}</p>
        </div>
```

次で置き換える:

```tsx
          aria-live='polite'>
          <p>
            <CircleAlert
              size={16}
              aria-hidden
            />{' '}
            {formError}
          </p>
        </div>
```

- [ ] **Step 4: `$id.edit.tsx` に import と戻るリンク・エラーサマリー**

`src/routes/_protected/tags/$id.edit.tsx` の import 群に追加:

```tsx
import { ArrowLeft, CircleAlert } from 'lucide-react'
```

次を探す:

```tsx
          className='pantry-text-link'>
          一覧へ戻る
        </Link>
      </nav>
```

次で置き換える:

```tsx
          className='pantry-text-link'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </Link>
      </nav>
```

次を探す:

```tsx
          aria-live='polite'>
          <p>{formError}</p>
        </div>
```

次で置き換える:

```tsx
          aria-live='polite'>
          <p>
            <CircleAlert
              size={16}
              aria-hidden
            />{' '}
            {formError}
          </p>
        </div>
```

- [ ] **Step 5: `$id/index.tsx` に import を追加**

`src/routes/_protected/tags/$id/index.tsx` の import 群に追加:

```tsx
import { ArrowLeft, Bookmark, CircleCheck, Pencil, Pin } from 'lucide-react'
```

- [ ] **Step 6: タグ登録フラッシュに CircleCheck**

次を探す:

```tsx
{
  newTagCreated ? <output className='pantry-flash'>タグを登録しました</output> : null
}
```

次で置き換える:

```tsx
{
  newTagCreated ? (
    <output className='pantry-flash'>
      <CircleCheck
        size={16}
        aria-hidden
      />{' '}
      タグを登録しました
    </output>
  ) : null
}
```

- [ ] **Step 7: タグ更新フラッシュに CircleCheck**

次を探す:

```tsx
{
  tagUpdated ? <output className='pantry-flash'>タグを更新しました</output> : null
}
```

次で置き換える:

```tsx
{
  tagUpdated ? (
    <output className='pantry-flash'>
      <CircleCheck
        size={16}
        aria-hidden
      />{' '}
      タグを更新しました
    </output>
  ) : null
}
```

- [ ] **Step 8: 戻るリンクに ArrowLeft**

次を探す:

```tsx
          className='pantry-text-link'>
          一覧へ戻る
        </Link>
      </nav>
```

次で置き換える:

```tsx
          className='pantry-text-link'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </Link>
      </nav>
```

- [ ] **Step 9: ピン状態に Pin**

次を探す:

```tsx
          <dt>ピン</dt>
          <dd>{tag.pinned ? '留めている' : 'なし'}</dd>
```

次で置き換える:

```tsx
          <dt>ピン</dt>
          <dd>
            {tag.pinned ? (
              <>
                <Pin
                  size={16}
                  aria-hidden
                />{' '}
                留めている
              </>
            ) : (
              'なし'
            )}
          </dd>
```

- [ ] **Step 10: 「この棚のブックマークを見る」に Bookmark**

> Note: `Bookmarks`（複数形）は lucide-react@1.21.0 に存在しないため `Bookmark`（単数形）を使用する。

次を探す:

```tsx
          className='pantry-button pantry-button--accent'>
          この棚のブックマークを見る
        </Link>
```

次で置き換える:

```tsx
          className='pantry-button pantry-button--accent'>
          <Bookmark
            size={16}
            aria-hidden
          />{' '}
          この棚のブックマークを見る
        </Link>
```

- [ ] **Step 11: 「編集」に Pencil**

次を探す:

```tsx
          className='pantry-button pantry-button--secondary'>
          編集
        </Link>
```

次で置き換える:

```tsx
          className='pantry-button pantry-button--secondary'>
          <Pencil
            size={16}
            aria-hidden
          />{' '}
          編集
        </Link>
```

- [ ] **Step 12: テスト・型チェック**

Run: `pnpm run test && pnpm run typecheck`
Expected: 全テスト PASS、型エラーなし

- [ ] **Step 13: コミット**

```bash
git add src/routes/_protected/tags/new.tsx "src/routes/_protected/tags/\$id.edit.tsx" "src/routes/_protected/tags/\$id/index.tsx"
git commit -m "feat(ui): add icons to tag workbench and tag detail"
```

---

## Task 11: 認証・設定

**Files:**

- Modify: `src/routes/sign-in/index.tsx`
- Modify: `src/routes/sign-in/-components/sign-in-with-email-and-password-form.tsx`
- Modify: `src/routes/_protected/settings/index.tsx`

- [ ] **Step 1: `sign-in/index.tsx` に import とブランドアイコン**

`src/routes/sign-in/index.tsx` の import 群に追加:

```tsx
import { Package } from 'lucide-react'
```

次を探す:

```tsx
<p className='pantry-sign-in__brand'>Pantry</p>
```

次で置き換える:

```tsx
<p className='pantry-sign-in__brand'>
  <Package
    size={28}
    aria-hidden
  />
  Pantry
</p>
```

- [ ] **Step 2: サインインフォームに import を追加**

`src/routes/sign-in/-components/sign-in-with-email-and-password-form.tsx` の import 群に追加:

```tsx
import { CircleAlert, Lock, LogIn, Mail } from 'lucide-react'
```

- [ ] **Step 3: フォームエラーサマリーに CircleAlert**

次を探す:

```tsx
          aria-live='polite'>
          <p>{signInErrorMessage(signInError)}</p>
        </div>
```

次で置き換える:

```tsx
          aria-live='polite'>
          <p>
            <CircleAlert
              size={16}
              aria-hidden
            />{' '}
            {signInErrorMessage(signInError)}
          </p>
        </div>
```

- [ ] **Step 4: メールラベルに Mail**

次を探す:

```tsx
            <div className='pantry-field'>
              <label htmlFor={field.props.name}>メール</label>
```

次で置き換える:

```tsx
            <div className='pantry-field'>
              <label htmlFor={field.props.name}>
                <Mail
                  size={16}
                  aria-hidden
                />{' '}
                メール
              </label>
```

- [ ] **Step 5: パスワードラベルに Lock**

次を探す:

```tsx
            <div className='pantry-field'>
              <label htmlFor={field.props.name}>パスワード</label>
```

次で置き換える:

```tsx
            <div className='pantry-field'>
              <label htmlFor={field.props.name}>
                <Lock
                  size={16}
                  aria-hidden
                />{' '}
                パスワード
              </label>
```

- [ ] **Step 6: サインイン送信に LogIn**

次を探す:

```tsx
        disabled={isPending}>
        {isPending ? 'サインイン中...' : 'サインイン'}
      </button>
```

次で置き換える:

```tsx
        disabled={isPending}>
        <LogIn
          size={16}
          aria-hidden
        />{' '}
        {isPending ? 'サインイン中...' : 'サインイン'}
      </button>
```

- [ ] **Step 7: `settings/index.tsx` に import を追加**

`src/routes/_protected/settings/index.tsx` の import 群に追加:

```tsx
import { ArrowLeft, LogOut } from 'lucide-react'
```

- [ ] **Step 8: ログアウトボタンに LogOut**

次を探す:

```tsx
          disabled={isPending}>
          {isPending ? 'ログアウト中...' : 'ログアウト'}
        </button>
```

次で置き換える:

```tsx
          disabled={isPending}>
          <LogOut
            size={16}
            aria-hidden
          />{' '}
          {isPending ? 'ログアウト中...' : 'ログアウト'}
        </button>
```

- [ ] **Step 9: 「玄関へ戻る」に ArrowLeft**

次を探す:

```tsx
        className='pantry-text-link'>
        玄関へ戻る
      </Link>
```

次で置き換える:

```tsx
        className='pantry-text-link'>
        <ArrowLeft
          size={16}
          aria-hidden
        />{' '}
        玄関へ戻る
      </Link>
```

- [ ] **Step 10: テスト・型チェック**

Run: `pnpm run test && pnpm run typecheck`
Expected: 全テスト PASS、型エラーなし

- [ ] **Step 11: コミット**

```bash
git add src/routes/sign-in/index.tsx "src/routes/sign-in/-components/sign-in-with-email-and-password-form.tsx" src/routes/_protected/settings/index.tsx
git commit -m "feat(ui): add icons to sign-in and settings"
```

---

## Task 12: 最終検証

- [ ] **Step 1: リント・フォーマット・テスト・型チェックを全実行**

Run: `pnpm run lint && pnpm run format:check && pnpm run test && pnpm run typecheck`
Expected: すべて成功

- [ ] **Step 2: フォーマットが崩れていれば修正**

もし `format:check` が失敗したら:

Run: `pnpm run format`
Expected: フォーマット適用後、再度 `pnpm run format:check` が通る

- [ ] **Step 3: dev サーバーで全画面を目視確認**

Run: `pnpm run dev`（バックグラウンド）

ブラウザで以下を確認する:

- `/sign-in`: Package ブランド、Mail/Lock ラベル、LogIn ボタン
- `/`（玄関）: 各ボックスに Package、空状態に Plus
- `/`（一覧 view=list）: ツールバーの Search/List/LayoutGrid/Plus、チップの X
- ブックマーク詳細: ArrowLeft/CircleCheck/ExternalLink/Pencil/Trash2
- `/tags`: Plus/新規タグ、Pin 列、Pencil 編集、ステッパーの Minus/Plus
- `/settings`: LogOut、ArrowLeft
- ローディング中に LoaderCircle が回転すること
- エラー表示に TriangleAlert が出ること

- [ ] **Step 4: dev サーバーを停止**

- [ ] **Step 5: 変更がないか最終確認し、必要ならコミット**

Run: `git status`
Expected: フォーマット修正があればそれをコミット:

```bash
git add -A
git commit -m "style: format after icon rollout"
```
