# React Scan Local Dev Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ローカル開発時のみ React Scan を自動有効化し、本番 HTML / 本番ランタイムには含めない。

**Architecture:** `react-scan` を `devDependencies` に追加し、`RootDocument` の `<head>` で公式 `auto.global.js` を `import.meta.env.DEV` が真のときだけ出力する。アプリ本体の計測対象コードと TanStack Devtools は変更しない。外部スクリプト失敗時のアプリ独自フォールバックは追加しない。

**Tech Stack:** react-scan (`auto.global.js` via unpkg CDN), Vite `import.meta.env.DEV`, TanStack Start `RootDocument`, pnpm

**Spec:** `docs/superpowers/specs/2026-08-06-react-scan-design.md`

## Global Constraints

- 新規テスト（ユニット / 結合 / e2e）は追加しない。検証は Task 3 の手動・コマンド確認のみ。
- 本番 HTML に React Scan の `<script>` を出力しない。ゲートは `import.meta.env.DEV` のみ（専用 env / feature flag は作らない）。
- 外部スクリプト失敗時にアプリ独自のエラー表示・トースト・リトライ・フォールバック UI・`onerror` は追加しない。
- `react-scan` の module import（`import { scan } from 'react-scan'`）や Vite プラグインは導入しない。
- 計測対象となる既存 React アプリコードと TanStack Devtools は変更しない。変更は依存追加と `RootDocument` の統合箇所のみ。
- `.cursor/` と `.env.production` は変更・追加・削除・コミットしない。

---

## File Structure

| 操作   | パス                                                  | 責務                                                                    |
| ------ | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| Modify | `package.json`                                        | `react-scan` を `devDependencies` に追加（`dependencies` には入れない） |
| Modify | `pnpm-lock.yaml`                                      | `pnpm add -D react-scan` による lockfile 更新                           |
| Modify | `src/features/app-shell/components/root-document.tsx` | `<head>` に DEV 限定の公式 `auto.global.js` script を追加               |

---

### Task 1: react-scan を devDependencies に追加する

**Files:**

- Modify: `package.json`（`devDependencies` に `react-scan` を追加）
- Modify: `pnpm-lock.yaml`（lockfile 更新）

**Interfaces:**

- Consumes: なし
- Produces: `devDependencies` に `react-scan` が存在する状態。Task 2 はアプリコードから `react-scan` を import しない（CDN script のみ）。

- [ ] **Step 1: `react-scan` を開発依存として追加する**

Run:

```bash
pnpm add -D react-scan
```

Expected:

- コマンドが exit code 0 で成功する
- `package.json` の `devDependencies` に `react-scan` が追加される
- `package.json` の `dependencies` に `react-scan` が含まれない
- `pnpm-lock.yaml` が更新される

- [ ] **Step 2: production dependencies に入っていないことを確認する**

Run:

```bash
node -e "const p=require('./package.json'); if (p.dependencies?.['react-scan']) process.exit(1); if (!p.devDependencies?.['react-scan']) process.exit(2); console.log('ok', p.devDependencies['react-scan'])"
```

Expected: `ok <version>` と表示され、exit code 0

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: add react-scan as a dev dependency

Enable local React Scan tooling without shipping it in production dependencies.
EOF
)"
```

---

### Task 2: RootDocument の head に DEV 限定 script を追加する

**Files:**

- Modify: `src/features/app-shell/components/root-document.tsx:20-24`（`<head>` 内、`<HeadContent />` より前）

**Interfaces:**

- Consumes: Task 1 で追加した `react-scan` パッケージ（ランタイム import はしない。公式 CDN の `auto.global.js` を読む）
- Produces: `import.meta.env.DEV === true` のときだけ `<head>` に公式 script が出力される `RootDocument`

**Do not change:**

- `{children}` 以降の計測対象アプリ本体
- `TanStackDevtools` / `tanstackDevtoolsConfig` / `tanstackDevtoolsPlugins`
- `<Scripts />`
- import 文（`react-scan` の module import を追加しない）

- [ ] **Step 1: `<head>` を次の内容に更新する**

`src/features/app-shell/components/root-document.tsx` の `<head>` を次のとおりにする（ファイル全体の最終形）:

```tsx
import type { TanStackDevtoolsReactInit } from '@tanstack/react-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

const tanstackDevtoolsConfig = {
  position: 'bottom-right'
} satisfies TanStackDevtoolsReactInit['config']

const tanstackDevtoolsPlugins = [
  {
    name: 'Tanstack Router',
    render: <TanStackRouterDevtoolsPanel />
  }
] satisfies TanStackDevtoolsReactInit['plugins']

export function RootDocument({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang='ja'>
      <head>
        <meta charSet='UTF-8' />
        <title>Pantry</title>
        {import.meta.env.DEV ? (
          <script
            crossOrigin='anonymous'
            src='//unpkg.com/react-scan/dist/auto.global.js'
          />
        ) : null}
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={tanstackDevtoolsConfig}
          plugins={tanstackDevtoolsPlugins}
        />
        <Scripts />
      </body>
    </html>
  )
}
```

要点:

- script は `<HeadContent />` より前
- `crossOrigin='anonymous'`
- `src='//unpkg.com/react-scan/dist/auto.global.js'`
- ゲートは `import.meta.env.DEV` のみ
- 外部 script 失敗用の `onerror` / 独自 fallback は追加しない
- 新規テストファイルは作らない

- [ ] **Step 2: 差分が統合箇所のみであることを確認する**

Run:

```bash
git diff -- src/features/app-shell/components/root-document.tsx
```

Expected:

- `import.meta.env.DEV` 条件の `<script ... auto.global.js />` 追加のみ
- TanStack Devtools 関連・`{children}`・既存 import に変更がない

- [ ] **Step 3: Commit**

```bash
git add src/features/app-shell/components/root-document.tsx
git commit -m "$(cat <<'EOF'
feat: enable React Scan in local RootDocument head

Load the official auto.global.js script only when import.meta.env.DEV is true.
EOF
)"
```

---

### Task 3: 開発時ツールバーと本番ビルドを検証する

**Files:**

- 変更なし（検証のみ。テストファイルは追加しない）

**Interfaces:**

- Consumes: Task 1 の依存追加、Task 2 の `RootDocument` script
- Produces: 手動検証結果（ツールバー表示、`pnpm run build` exit code 0）

- [ ] **Step 1: 開発サーバーで React Scan ツールバーを確認する**

Run:

```bash
pnpm run dev
```

Expected:

- 開発サーバーが起動する
- ブラウザでアプリを開くと React Scan のツールバーが表示される
- ページの `<head>` に `//unpkg.com/react-scan/dist/auto.global.js` の script が含まれる

確認後、開発サーバーを停止する。

- [ ] **Step 2: 本番ビルドが成功することを確認する**

Run:

```bash
pnpm run build
```

Expected:

- ビルドが exit code 0 で成功する
- 本番ビルドでは `import.meta.env.DEV === false` のため、成果物 HTML に React Scan の `<script src="//unpkg.com/react-scan/dist/auto.global.js">` は出力されない（ゲート保証。必須の自動化テストは追加しない）

- [ ] **Step 3: 検証結果にコード変更が無いことを確認する**

Run:

```bash
git status
```

Expected: `nothing to commit, working tree clean`（検証でファイルを変更していない）

検証専用のコミットは作らない。Task 1 / Task 2 のコミットが実装完了状態となる。

---

## Spec Coverage (self-review)

| 設計書の要件                                                                    | 対応タスク                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------- |
| `react-scan` を `devDependencies` に追加 / production dependencies に入れない   | Task 1                                      |
| `RootDocument` head へ公式 `auto.global.js` を `import.meta.env.DEV` 時のみ出力 | Task 2                                      |
| `<HeadContent />` より前に置く / `crossOrigin` + unpkg src                      | Task 2                                      |
| 計測対象コード・TanStack Devtools は変更しない                                  | Task 2 Do not change                        |
| 本番 HTML / 本番ランタイムに含めない                                            | Global Constraints + Task 2 + Task 3 Step 2 |
| 外部 script 失敗時の独自 fallback なし                                          | Global Constraints + Task 2                 |
| 新規テスト追加なし。`pnpm run dev` ツールバー + `pnpm run build` 成功           | Task 3                                      |
| module import / Vite plugin / 専用 env はスコープ外                             | Global Constraints                          |

## Placeholder / Ambiguity / Path Review

- TBD / TODO / 「適宜」「similar to」なし
- パスは設計書どおり `src/features/app-shell/components/root-document.tsx`
- script 属性は設計書どおり `crossOrigin='anonymous'` / `src='//unpkg.com/react-scan/dist/auto.global.js'`
- `RootDocument` の props 型 `{ readonly children: React.ReactNode }` を維持
