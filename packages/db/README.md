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
| `pnpm run auth:generate` | Better Auth CLI の参照スキーマを `.generated/auth-schema.ts` へ出力（`src/schema/auth-schema.ts` は上書きしない） |
| `pnpm run test` | Vitest（Node環境） |
| `pnpm run typecheck` | `tsc` |

ルートからの実行例: `pnpm run migrate:dev`、`pnpm run auth:generate`。

## 環境変数

env ファイル（`.env.schema`、`.env.development`、`.env.development.local`）は `packages/env` に置く。`packages/db/.env.schema` は `@import(../env/, pick=[APP_ENV, TURSO_*])` で libSQL 接続に必要なキーだけを取り込み、`migrate:dev` / `studio:dev` は varlock 経由で実行する。

```json
"migrate:dev": "varlock run -- drizzle-kit migrate"
```

`.env.development.local` は worktree ごとに `packages/env/scripts/symlink-env-for-worktree.ts` が生成する。`migrate:prod` は varlock を通さず、CI が渡す `TURSO_CONNECTION_URL` / `TURSO_AUTH_TOKEN` をそのまま読む。

`auth:generate` は Better Auth CLI が `apps/web/auth.ts` を読むため、引き続き `varlock run --path ../../apps/web/` を指す（移行は別フェーズ）。

## auth-schema の再生成

```bash
pnpm run auth:generate
```

`apps/web/auth.ts` を Better Auth CLI に読み込ませ、参照用スキーマを `packages/db/.generated/auth-schema.ts` へ出力する。`.generated/` は gitignore 済みで、drizzle-kit の入力（`src/schema/`）にはならない。**この出力で `src/schema/auth-schema.ts` を上書きしない**。

CLI の出力は singular table name（`user` / `session` など）と `relations(...)` を生成するが、コミット済みの `src/schema/auth-schema.ts` は手で保守している。plural table name（`users` / `sessions` など）、snake_case の column、ソート済みキー、独自の型 export を保ったまま、`.generated/auth-schema.ts` との差分を手で移植する。

移植後は `packages/db` で `drizzle-kit generate` を実行し、マイグレーションを生成する。`apps/web` の env（`TURSO_*`、`BETTER_AUTH_*`）が必要なため、CLI は varlock 経由で実行する。

## マイグレーション

`drizzle.config.ts` は `schema: "./src/schema"`、`out: "./drizzle"` を指す。生成された SQL と snapshot は `drizzle/` に置き、内容は変更しない。適用は `pnpm run migrate:dev`（開発）または `migrate:prod`（本番）で行う。
