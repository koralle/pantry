# @pantry/env

Pantry のローカル開発用の値を置く。スキーマもコードの大半も持たず、env ファイル・ローダー・worktree 用スクリプトだけを置く。

## 値ファイル

| ファイル | 役割 |
| --- | --- |
| `.env.development` | 共有の開発値。worktree では main checkout の実体を symlink する。`.env.development.example` をコピーして作る |
| `.env.development.local` | worktree ごとの上書き（`TURSO_PROJECT` / `TURSO_PORT` / `TURSO_CONNECTION_URL`）。`scripts/symlink-env-for-worktree.ts` が生成する。手で編集しない |

キーは `.env.development.example` を参照する。`APP_ENV` は `development` / `test` / `production`。

## 読み込み

`@pantry/env` の `loadDevEnv()` が `.env.development` → `.env.development.local` の順に読み、後のファイルが勝つ。`process.env` に既にある値は上書きしないので、シェルで `export` した値（CI の secrets、verify-pantry の検証用の上書き）が最優先になる。

| 利用元 | 呼び方 |
| --- | --- |
| `apps/api/scripts/{seed,create-user}.ts` | `scripts/auth.ts` が `loadDevEnv()` を呼ぶ |
| `packages/db`（`drizzle-kit migrate` / `studio`） | `drizzle.config.ts` が `loadDevEnv()` を呼ぶ |
| `apps/api` の Worker（`pnpm dev` / `pnpm dev:api`） | `vite.config.ts` が `workerVars()` で `wrangler` の `vars` に渡す |
| `apps/web` の Worker の auxiliary worker（`pnpm dev`） | `vite.config.ts` が `workerVars()` で api の `vars` に渡す |
| `just local-db-build` | shell で env ファイルを読み、`docker compose` の補間と接続待ちに使う |

`workerVars()` が返すのは api の Worker が必要とするキーだけ（`apps/api/src/env.d.ts` と同じ並び）。`process.env` を丸ごと渡すと無関係な値まで Worker の vars に入るため。

本番の値は GitHub Actions の secrets から wrangler-action の `secrets` / `vars` で渡す（`.github/workflows/workflow.yaml`）。env ファイルは本番では読まない。

## worktree

post-checkout フックが `packages/env/scripts/symlink-env-for-worktree.ts` を実行する。

1. main checkout の `packages/env/.env` と `.env.development` を worktree の同じパスへ symlink する。
2. worktree 固有の `TURSO_PORT` / `TURSO_PROJECT` / `TURSO_CONNECTION_URL` を `.env.development.local` へ書き出す。ポートは worktree の絶対パスから決めるため、worktree ごとに重複しない。

main checkout に値ファイルが無い場合は `Source ... not found. Skipping ...` と表示される。手動で実行する場合:

```bash
pnpm --filter @pantry/env exec tsx scripts/symlink-env-for-worktree.ts
```

以前は値ファイルを `apps/web/` に置いていた。main checkout に `apps/web/.env` / `apps/web/.env.development` が残っていると、スクリプトが警告するので `packages/env/` の同じ名前へ移す。
