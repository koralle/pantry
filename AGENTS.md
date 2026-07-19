# AGENTS.md

## プロジェクト概要

自分専用のタグベースのブックマークマネージャ。

## ディレクトリ構造

- `src/` - アプリケーションコード（TanStack Start + Cloudflare Workers）
- `src/features/` - Server Function と機能単位のUI・ロジック
- `src/db/` - Drizzle ORM のスキーマとTurso接続
- `public/` - 静的アセット

## 開発コマンド

| コマンド                | 説明                                     |
| ----------------------- | ---------------------------------------- |
| `pnpm run dev`          | 開発サーバー起動（Vite + workerd）       |
| `pnpm run build`        | プロダクションビルド                     |
| `pnpm run preview`      | ビルド成果物を preview                   |
| `pnpm run deploy`       | Cloudflare Workers にデプロイ            |
| `pnpm run test`         | テスト実行（Vitest）                     |
| `pnpm run cf-typegen`   | Worker バインディングの型生成            |
| `pnpm run migrate:dev`  | Turso開発DBへDrizzleマイグレーション適用 |
| `pnpm run migrate:prod` | Turso本番DBへDrizzleマイグレーション適用 |
| `pnpm run db:seed`      | Turso開発DBへテスト／開発データを投入    |

> **注意:** `pnpm run db:seed`は設定済みの開発データをすべて破棄して再投入する。使い捨ての開発DBに対してのみ実行すること。

## 設計方針

T.B.D

## 詳細ドキュメント

- アーキテクチャ: @docs/architecture.md
- テスト戦略: @docs/testing.md
- MVP設計: @docs/superpowers/specs/2026-07-19-turso-rpc-mvp-design.md
