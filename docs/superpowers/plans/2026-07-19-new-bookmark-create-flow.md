# 新規ブックマーク作成フロー（導線）— 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development（推奨）または superpowers:executing-plans を使って、この計画をタスクごとに実装すること。ステップはチェックボックス（`- [ ]`）記法で進捗を管理する。

**Goal:** ブックマーク一覧画面から新規作成画面（`/bookmarks/new`）へ遷移する導線を追加する。ヘッダーへの常設リンク、一覧画面内のリンク、および作成画面の「一覧へ戻る」リンクの確認・整備。作成フォーム自体は変更しない。

**Architecture:** 既存の TanStack Router `Link` コンポーネントによる純粋なクライアントサイド遷移。Server Function、DB スキーマ、バリデーションの変更はなし。既存ファイル3箇所への小さな編集ののち、Playwright で3つの遷移経路をウォークスルー検証する。

**Tech Stack:** TanStack Router（`Link`, `createFileRoute`）、React、Base UI（`@base-ui/react`）、Vitest（既存テストは影響なし）、Playwright MCP（手動ウォークスルー検証）。

---

## ファイル構成

- `src/routes/_protected.tsx` — `<header><nav>` を持つレイアウト。既存のタグ/設定リンクと並べて「＋新規ブックマーク」`Link` を追加。
- `src/routes/_protected/index.tsx` — 一覧画面（`/`）。見出しのそば、`BookmarkTable` の上に「新規作成」`Link` を追加。
- `src/routes/_protected/bookmarks/new/index.tsx` — 作成画面。既存の「一覧へ戻る」`Link` を確認し、配置・ラベルのみ整備（動作変更なし）。

新規ファイルなし。テストファイルなし（単体テストすべきロジックがないため。検証は Playwright ウォークスルーで行う）。

---

## Task 1: ヘッダーに新規作成へのリンクを追加

**Files:**
- Modify: `src/routes/_protected.tsx:48-68`（`<header><nav>` ブロック）

- [ ] **Step 1: ナビに `Link` を追加**

`src/routes/_protected.tsx` の `Layout` コンポーネントの `<nav>` は現在 `/`、`/tags`、`/settings` へのリンクを出力している。既存のナビリンクの直後（Sign Out ボタンの前）に `/bookmarks/new` への `Link` を追加する。このファイルはすでに `@tanstack/react-router` から `Link` をインポートしているため、新規インポートは不要。

nav ブロックを以下のように置き換える：

```tsx
        <nav>
          <Link
            to='/'
            search={{ tagMode: 'and', sort: 'newest' }}>
            Pantry
          </Link>
          <Link
            to='/tags'
            search={{ limit: 50, offset: 0 }}>
            タグ
          </Link>
          <Link to='/settings'>設定</Link>
          <Link to='/bookmarks/new'>＋新規ブックマーク</Link>
        </nav>
```

- [ ] **Step 2: ビルド／型チェックを確認**

Run: `pnpm run build`
Expected: エラーなくビルドが成功し、`_protected.tsx` に関する型エラーが出ないこと。

（`build` が遅い場合は `pnpm exec tsc --noEmit` でも可。新しいエラーが出ないことを確認。）

- [ ] **Step 3: コミット**

```bash
git add src/routes/_protected.tsx
git commit -m "feat: add header link to new bookmark creation screen"
```

---

## Task 2: 一覧画面内に新規作成へのリンクを追加

**Files:**
- Modify: `src/routes/_protected/index.tsx:40-53`（`RouteComponent` の return）

- [ ] **Step 1: 見出しのそばに `Link` を追加**

`src/routes/_protected/index.tsx` の `RouteComponent` は見出しの直後に `BookmarkTable` を出力している。このファイルはすでに `@tanstack/react-router` から `Link` をインポートしている。`<h1>` と `<ErrorBoundary>` の間に「新規作成」`Link` を追加する。

`RouteComponent` の return ブロックを以下のように置き換える：

```tsx
  return (
    <>
      <h1>{user.name}のブックマーク一覧</h1>

      <Link to='/bookmarks/new'>新規作成</Link>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<p>Loading...</p>}>
          <BookmarkTable bookmarkPromise={bookmarksPromise} />
        </Suspense>
      </ErrorBoundary>
    </>
  )
```

- [ ] **Step 2: ビルド／型チェックを確認**

Run: `pnpm run build`
Expected: エラーなくビルドが成功し、`index.tsx` に関する型エラーが出ないこと。

- [ ] **Step 3: コミット**

```bash
git add src/routes/_protected/index.tsx
git commit -m "feat: add in-list link to new bookmark creation screen"
```

---

## Task 3: 作成画面の「一覧へ戻る」リンクを確認・整備

**Files:**
- Modify（確認のみ、必要なら整備）: `src/routes/_protected/bookmarks/new/index.tsx:26-39`（`RouteComponent` の return）

- [ ] **Step 1: 既存の戻るリンクを確認**

`src/routes/_protected/bookmarks/new/index.tsx` を開き、`RouteComponent` にすでに以下が含まれていることを確認する：

```tsx
      <Link
        to='/'
        search={{ tagMode: 'and', sort: 'newest' }}>
        一覧へ戻る
      </Link>
```

- [ ] **Step 2: 必要に応じて配置・ラベルを整備（動作変更なし）**

このリンクはデフォルトの検索条件で `/` へ遷移する。ラベルや配置が不明確でなければ変更は不要。整備する場合は `to='/'` と `search={{ tagMode: 'and', sort: 'newest' }}` をそのまま維持し、周囲の構造（`<nav>` での囲みや `aria-label` の追加など）のみ調整すること。遷移先や検索条件は変更してはならない。

変更しない場合は Step 4 へ飛ぶ。変更した場合は以下を実行：

`pnpm run build`
Expected: ビルドが成功すること。

- [ ] **Step 3: コミット（Step 2 で変更した場合のみ）**

```bash
git add src/routes/_protected/bookmarks/new/index.tsx
git commit -m "chore: tidy back-to-list link on new bookmark screen"
```

（変更がなかった場合はコミットせず、作業ツリーをクリーンに保つ。）

- [ ] **Step 4: このタスクによる作業ツリーの変更が残っていないことを確認**

Run: `git status --short`
Expected: `src/routes/_protected/bookmarks/new/index.tsx` に意図しない変更が残っていないこと（整備コミットをした場合はそのコミットのみ）。

---

## Task 4: Playwright ウォークスルー検証

**Files:** なし（検証のみ）

- [ ] **Step 1: 開発サーバーを起動**

（別ターミナルで）Run: `pnpm run dev`
ローカル URL（例: `http://localhost:5173` や workerd のローカルアドレス）が表示されるまで待つ。

- [ ] **Step 2: サインイン**

Playwright MCP を使って開発サーバーのルートへ移動し、開発用認証情報でサインインし、`/`（一覧画面）に到達することを確認する。

- [ ] **Step 3: 経路1 — ヘッダーリンクを検証**

ヘッダーの「＋新規ブックマーク」リンクをクリック。URL が `/bookmarks/new` になり、「ブックマーク新規作成」見出しが表示されることを確認。

- [ ] **Step 4: 経路2 — 一覧内リンクを検証**

`/` へ戻る。一覧内の「新規作成」リンク（見出しのそば）をクリック。URL が `/bookmarks/new` になることを確認。

- [ ] **Step 5: 経路3 — 一覧へ戻るリンクを検証**

`/bookmarks/new` で「一覧へ戻る」をクリック。URL が `/` になり、一覧テーブルが表示されることを確認。

- [ ] **Step 6: アクセシビリティの簡易確認**

3つのリンクそれぞれについて、ラベルが明確で読みやすく、キーボード（Tab でフォーカス、Enter で遷移）で到達・操作できることを確認。

- [ ] **Step 7: 開発サーバーを停止**

Step 1 で起動した `pnpm run dev` プロセスを停止する。

---

## 自己レビュー記録

- **仕様カバレッジ:** 仕様セクション a（ヘッダーリンク）→ Task 1；b（一覧内リンク）→ Task 2；c（戻るリンクの確認・整備）→ Task 3；テスト・検証（3経路）→ Task 4。すべて網羅。
- **プレースホルダー確認:** TBD/TODO/「上記と同様」などの記述なし。すべてのコードブロックは完結している。
- **型の一貫性:** 3ファイルとも `Link` のインポートは既存。ルートツリーに合う `to` パス（`/bookmarks/new`、`/`、`/tags`、`/settings`）。`/` の検索条件の形は既存の「一覧へ戻る」リンクやヘッダーの「Pantry」リンクと一致。一貫性あり。
- **範囲外（明示的に除外）:** タイトル自動取得、タグ選択/新規作成、メモ入力、フォーム構造の変更 — 本計画に含まない。
