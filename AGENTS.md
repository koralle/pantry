# AGENTS.md

## プロジェクト概要

自分専用のタグベースのブックマークマネージャ。

## ディレクトリ構造

- `src/` - アプリケーションコード（TanStack Start + Hono）
- `src/api/` - Hono API ルート
- `api-spec/` - TypeSpec API 契約定義
- `public/` - 静的アセット

## 開発コマンド

| コマンド               | 説明                                   |
| ---------------------- | -------------------------------------- |
| `pnpm run dev`         | 開発サーバー起動（Vite + workerd）     |
| `pnpm run build`       | プロダクションビルド                   |
| `pnpm run preview`     | ビルド成果物を preview                 |
| `pnpm run deploy`      | Cloudflare Workers にデプロイ          |
| `pnpm run test`        | テスト実行（Vitest）                   |
| `pnpm run cf-typegen`  | Worker バインディングの型生成          |
| `pnpm run spec:build`  | TypeSpec をコンパイルして OpenAPI 出力 |
| `pnpm run spec:format` | TypeSpec のフォーマット修正            |

## 設計方針

T.B.D

## 詳細ドキュメント

- アーキテクチャ: @docs/architecture.md
- テスト戦略: @docs/testing.md
