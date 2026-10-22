# @pantry/db

Pantry のデータベース層。Drizzle ORM のスキーマ、マイグレーション、Turso（libSQL）接続ファクトリを提供する。ビルドは行わず、TypeScript のソースをそのまま公開する（`apps/web` からもソースのまま解決される）。

## エクスポート

| specifier | 内容 |
| --- | --- |
| `@pantry/db` | `createDb`、`resolveTursoConnection`、型 `AppDb` / `TursoConnection` / `TursoConnectionEnv` |
| `@pantry/db/schema/*` | `src/schema/` 配下のテーブル定義（例: `@pantry/db/schema/bookmark`、`@pantry/db/schema/auth-schema`） |
| `@pantry/db/migrations` | `migrationsFolder`（`packages/db/drizzle` の絶対パス。Node 専用） |

barrel file を避けるため `@pantry/db/schema` というまとめエクスポートは持たない。テーブル単位で import する。

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `pnpm run migrate:dev` | 開発DBへマイグレーション適用 |
| `pnpm run migrate:prod` | 本番DBへマイグレーション適用（CIが`TURSO_*`を直接渡す） |
| `pnpm run studio:dev` | Drizzle Studio を起動 |
| `pnpm run test` | Vitest（Node環境） |
| `pnpm run typecheck` | `tsc` |

ルートからの実行例: `pnpm run migrate:dev`。

## 環境変数

env ファイル（`.env.development`、`.env.development.local`）は `packages/env` に置く。`drizzle.config.ts` が `@pantry/env` の `loadDevEnv()` を呼ぶので、`migrate:dev` / `studio:dev` は追加のラッパー無しで値を読める。`process.env` に既にある値（CI の secrets）が優先されるため、`migrate:prod` は env ファイルが無い CI でもそのまま動く。

```json
"migrate:dev": "drizzle-kit migrate"
```

`.env.development.local` は worktree ごとに `packages/env/scripts/symlink-env-for-worktree.ts` が生成する。

## マイグレーション

`drizzle.config.ts` は `schema: "./src/schema"`、`out: "./drizzle"` を指す。生成された SQL と snapshot は `drizzle/` に置き、内容は変更しない。適用は `pnpm run migrate:dev`（開発）または `migrate:prod`（本番）で行う。
