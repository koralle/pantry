# AGENTS.md

## プロジェクト概要

自分専用のタグベースのブックマークマネージャ。

## エージェントルール

リポジトリ上で作業する前に、作業内容に応じて `.agents/rules/` 配下のルールを読む。

- Issueの仕様策定・更新を行う場合: `.agents/rules/issue-specification.md`
- GitHub Issueを起点に実装する場合: `.agents/rules/issue-driven-development.md`
- コードを変更・レビューする前に: `.agents/rules/ultracite.md`
- Ultracite のコマンド: `.agents/references/ultracite.md`
- コード変更を完了する前に `pnpm check` を実行する

`.agents/rules/` 配下を規範的なルールの正本とする。この `AGENTS.md` にはルール本文を重複して記載しない。

## ディレクトリ構造

- `apps/api/` - API Worker（Hono + oRPC）。Cloudflare Worker `pantry-api` としてデプロイし、`/rpc/*` と `/api/auth/*` を提供する。contract は `packages/api-contract`。
  - `src/` - `createApp`（Hono）/ oRPC router / Better Auth 構成
  - `src/auth/` - Better Auth の正本構成（`create-auth.ts`）と認証 port（`session.ts`）
- `apps/web/` - アプリケーション本体（TanStack Start + Cloudflare Workers）。以下の項目はすべて配下。
  - `panda/` - Panda CSS の codegen 入力（globalCss・トークン定義。`panda.config.ts` から組み立てる。ADR-0002）
  - `src/` - アプリケーションコード
  - `src/server.ts` - Worker entry。`/rpc/*` と `/api/auth/*` を Service Binding（`env.API`）で `pantry-api` へ転送し、それ以外を TanStack Start へ渡す
  - `src/api/` - `pantry-api` の oRPC client（ブラウザ用 `client.ts`、SSR 用 `client.server.ts`）
  - `src/features/` - Server Function と機能単位のUI・ロジック
  - `public/` - 静的アセット
- `packages/api-contract/` - `@pantry/api-contract`。oRPC の contract（procedure の input / output / 型付きエラー）だけを持ち、実装は `apps/api` が持つ
- `packages/db/` - `@pantry/db`。Drizzle ORM のスキーマ、マイグレーション、`drizzle.config.ts`、接続ファクトリ `createDb`
- `packages/env/` - `@pantry/env`。Varlock の env スキーマを関心ごとに分割して管理し、値ファイルと worktree 用スクリプトを置く
- `packages/test-support/` - `@pantry/test-support`。テスト用に libSQL server の image と Testcontainers の起動設定を `@pantry/test-support/libsql` として共有する
- `packages/forge/` - `@pantry/forge`。ツールチェインの共通設定を持つ。`tsconfig/base.json` / `tsconfig/node.json`（各 `tsconfig.json` が `extends`）、`@pantry/forge/oxlint`（Ultracite の core / react / tanstack の拡張、共通ルール、共通 ignorePatterns）、`@pantry/forge/oxfmt`（Ultracite の Oxfmt 設定、共通 ignorePatterns）を export する。各 `oxlint.config.ts` は `extends` し、差分だけを書き足す
  - Oxlint はファイルごとに最も近い設定だけを使い、親設定とはマージしない。`apps/web/oxlint.config.ts` を置いた時点で apps/web 配下はルート設定の対象外になるため、全パッケージに効かせたい設定は各 `oxlint.config.ts` ではなく `packages/forge` に置く
- `docs/` - 設計・方針ドキュメント
- `.agents/` - エージェント向けルールとスキル

## 開発コマンド

ルートのコマンドはアプリ本体（`@pantry/web`）またはDB（`@pantry/db`）へ委譲する。

| コマンド | 説明 |
| --- | --- |
| `pnpm run dev` | 開発サーバー起動（Vite + workerd。`@pantry/web`。`pantry-api` も auxiliary worker として同時に起動する） |
| `pnpm run dev:api` | API Worker の開発サーバー起動（`@pantry/api`、`http://localhost:8787`） |
| `pnpm run build` | プロダクションビルド（全アプリ） |
| `pnpm run preview` | ビルド成果物を preview（`@pantry/web`） |
| `pnpm run deploy` | Cloudflare Workers にデプロイ（`@pantry/web`） |
| `pnpm run deploy:api` | API Worker（`pantry-api`）にデプロイ（`@pantry/api`） |
| `pnpm run test` | テスト実行（Vitest。Docker 不要） |
| `pnpm run test:db` | DB Integration test（Testcontainers + 実 libSQL） |
| `pnpm run typecheck` | ルート設定とアプリの型検査 |
| `pnpm run cf-typegen` | Worker バインディングの型生成（全アプリ。`worker-configuration.d.ts`） |
| `pnpm run migrate:dev` | Turso開発DBへDrizzleマイグレーション適用（`@pantry/db`） |
| `pnpm run migrate:prod` | Turso本番DBへDrizzleマイグレーション適用（CI。`@pantry/db`） |
| `pnpm run studio:dev` | Drizzle Studio を起動（`@pantry/db`） |
| `pnpm run db:seed` | Turso開発DBへテスト／開発データを投入 |
| `pnpm run check` | Ultracite（Oxlint + Oxfmt）の検査 |
| `pnpm run fix` | Ultracite の自動修正 |
| `pnpm run lint:markup` | HTML/JSX のアクセシビリティ・マークアップ検査（markuplint） |

## 設計方針

T.B.D

## 詳細ドキュメント

- Issue Driven Development: @docs/issue-driven-development.md
- ChatGPTプロジェクト指示: @docs/chatgpt-project-instructions.md
- アーキテクチャ: @docs/architecture.md
- テスト戦略: @docs/testing.md
- MVP設計: @docs/superpowers/specs/2026-07-19-turso-rpc-mvp-design.md
