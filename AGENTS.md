# AGENTS.md

## プロジェクト概要

自分専用のタグベースのブックマークマネージャ。

## エージェントルール

リポジトリ上で作業する前に、作業内容に応じて `.agents/rules/` 配下のルールを読む。

- Issueの仕様策定・更新を行う場合: `.agents/rules/issue-specification.md`
- GitHub Issueを起点に実装する場合: `.agents/rules/issue-driven-development.md`

`.agents/rules/` 配下を規範的なルールの正本とする。
この `AGENTS.md` にはルール本文を重複して記載しない。

## ディレクトリ構造

- `src/` - アプリケーションコード（TanStack Start + Cloudflare Workers）
- `src/features/` - Server Function と機能単位のUI・ロジック
- `src/db/` - Drizzle ORM のスキーマとTurso接続
- `public/` - 静的アセット

## 開発コマンド

| コマンド               | 説明                                                        |
| ---------------------- | ----------------------------------------------------------- |
| `pnpm run dev`         | 開発サーバー起動（Vite + workerd）                          |
| `pnpm run build`       | プロダクションビルド                                        |
| `pnpm run preview`     | ビルド成果物を preview                                      |
| `pnpm run deploy`      | Cloudflare Workers にデプロイ                               |
| `pnpm run test`        | テスト実行（Vitest）                                        |
| `pnpm run cf-typegen`  | Worker バインディングの型生成                               |
| `pnpm run migrate:dev` | Turso開発DBへDrizzleマイグレーション適用                    |
| `pnpm run db:seed`     | Turso開発DBへテスト／開発データを投入                       |
| `pnpm run lint:markup` | HTML/JSX のアクセシビリティ・マークアップ検査（markuplint） |

## 設計方針

T.B.D

## 詳細ドキュメント

- Issue Driven Development: @docs/issue-driven-development.md
- ChatGPTプロジェクト指示: @docs/chatgpt-project-instructions.md
- アーキテクチャ: @docs/architecture.md
- テスト戦略: @docs/testing.md
- MVP設計: @docs/superpowers/specs/2026-07-19-turso-rpc-mvp-design.md
