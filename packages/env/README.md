# @pantry/env

Pantry の環境変数スキーマ（Varlock）を管理する。ランタイムコードは持たず、`.env.schema` と環境ごとの値ファイル、worktree 用スクリプトだけを置く。

## スキーマの分割

`packages/env/.env.schema` がルートスキーマで、関心ごとに分割したスキーマを `schemas/` から `@import` する。`@defaultSensitive` などのルートデコレータは同じファイルの項目にしか効かないため、各スキーマファイルも先頭に `# @defaultSensitive=false` と `# ---` を持つ。

| ファイル | 項目 | 主な利用元 |
| --- | --- | --- |
| `schemas/.env.db` | `TURSO_CONNECTION_URL`、`TURSO_AUTH_TOKEN` | `@pantry/db`、`@pantry/api` |
| `schemas/.env.auth` | `BETTER_AUTH_SECRET`、`BETTER_AUTH_URL` | `@pantry/api` |
| `schemas/.env.local-libsql` | `TURSO_PORT`、`TURSO_PROJECT` | `apps/web/local-libsql`（`just local-db-build` の docker compose）、`apps/api/scripts`（seed のポート検査で `TURSO_PORT` だけ） |

## 消費側

各消費側の `.env.schema` は `packages/env/` をディレクトリごと `@import` し、`pick=[...]` で必要なキーだけを取り込む。値は `packages/env/` 直下の env ファイルから読み込まれる（worktree では次節のとおり symlink される）。

| 消費側 | `.env.schema` | 取り込むキー |
| --- | --- | --- |
| `apps/web` | `@import(../../packages/env/, pick=[APP_ENV])` | Worker 用。`APP_ENV` だけ。API へは Service Binding で到達し、DB 接続も Better Auth（`apps/api` にある）も取り込まない |
| `apps/web/local-libsql` | `@import(../../../packages/env/, pick=[APP_ENV, TURSO_CONNECTION_URL, TURSO_PORT, TURSO_PROJECT])` | `just local-db-build` / `local-db-clean` の docker compose（`varlock run --path local-libsql/`）用。本番の Worker の env には入らない |
| `apps/api` | `@import(../../packages/env/, pick=[APP_ENV, TURSO_CONNECTION_URL, TURSO_AUTH_TOKEN, BETTER_AUTH_*])` | Worker（本番と `pnpm dev` の auxiliary worker）用。libSQL 接続と Better Auth |
| `apps/api/scripts` | `@import(../../../packages/env/, pick=[APP_ENV, TURSO_CONNECTION_URL, TURSO_AUTH_TOKEN, TURSO_PORT, BETTER_AUTH_*])` | seed / create-user（`varlock run --path scripts/`）用。`TURSO_PORT` は seed が接続先ポートとの一致を確かめるためだけに使い、Worker の env には入れない |
| `packages/db` | `@import(../env/, pick=[APP_ENV, TURSO_CONNECTION_URL, TURSO_AUTH_TOKEN])` | `APP_ENV` と libSQL 接続だけ。Better Auth と docker compose 用のキーは取り込まない |

消費側の値ファイル（`apps/web/.env` や `apps/web/.env.local`）は import した値より優先される。`apps/web/.env.local`・`apps/api/.env.local`・`apps/api/scripts/.env.local` は検証用スクリプト（`.cursor/skills/verify-pantry/`）が一時的な override として使う。

## 値の置き場所

値は `packages/env/` 直下の gitignore 済みファイルに置く。`@currentEnv=$APP_ENV` により、`APP_ENV` に対応する `.env.<env>` が自動で読み込まれる。

| ファイル | 役割 |
| --- | --- |
| `packages/env/.env` | ローカルの共通値 |
| `packages/env/.env.development` | 開発用の共通値（main checkout の実体を worktree へ symlink） |
| `packages/env/.env.development.local` | worktree ごとの libSQL 設定（自動生成。手で編集しない） |
| `packages/env/.env.production` | 本番値 |

優先順位は `.env.schema` < `.env` < `.env.local` < `.env.<APP_ENV>` < `.env.<APP_ENV>.local` < `process.env`。値の例は各スキーマの `@example` を参照する。

## worktree

post-checkout フックが `packages/env/scripts/symlink-env-for-worktree.ts` を実行する。

1. main checkout の `packages/env/.env` と `packages/env/.env.development` を、worktree の同じパスへ symlink する。
2. worktree 固有の `TURSO_PORT` / `TURSO_PROJECT` / `TURSO_CONNECTION_URL` を `packages/env/.env.development.local` へ書き出す。ポートは worktree の絶対パスから決めるため、worktree ごとに重複しない。

main checkout に値ファイルが無い場合は `Source ... not found. Skipping ...` と表示される。手動で実行する場合:

```bash
pnpm --filter @pantry/env exec tsx scripts/symlink-env-for-worktree.ts
```

## 既存 checkout からの移行

以前は値ファイルを `apps/web/` に置いていた。main checkout に `apps/web/.env.development` や `apps/web/.env` が残っていると worktree へ symlink されない。`apps/web/.env.development` は環境別ファイルとして読まれなくなる（`apps/web/.env` は消費側の値として読まれ続けるが、`packages/db` からは見えない）。スクリプトが警告を出すので、次のように `packages/env/` の同じ名前へ移動する。

```bash
mv apps/web/.env.development packages/env/.env.development
mv apps/web/.env packages/env/.env
```

`apps/web/.env.development.local` は worktree 用の生成先ではなくなった。残っていれば削除してよい（検証用スクリプトが使う override は `apps/web/.env.local`）。
