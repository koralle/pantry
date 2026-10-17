# @pantry/api

Pantry の API Worker（Cloudflare Workers、`pantry-api`）。Hono の上で

- `/rpc/*` — `@pantry/api-contract` の contract を実装した oRPC
- `/api/auth/*` — Better Auth（メール・パスワード + パスキー登録/一覧/削除）

を待ち受ける。DB は Turso Cloud（libSQL）で、スキーマとマイグレーションは `@pantry/db` が持つ。

## ルート

| ルート | 内容 |
| --- | --- |
| `POST /rpc/health` | 認証不要。`{ status: "ok" }` |
| `POST /rpc/me` | Cookie セッション必須。`{ email, id, name }`。未認証は `UNAUTHORIZED`（401） |
| `GET/POST /api/auth/*` | Better Auth の handler へ素通し（`/api/auth/get-session`、`/api/auth/sign-in/email` など） |
| その他 | 404 |

procedure の追加は `packages/api-contract/src/contract.ts` と `src/rpc/router.ts` の両方に足す。contract を満たさない実装は型エラーになる。

## 環境変数

`packages/env/` の値を `.env.schema` の `@import(..., pick=[...])` で取り込む。Worker runtime では `cloudflare:workers` の `env` binding として読む。

| キー | 用途 |
| --- | --- |
| `APP_ENV` | 読み込む env ファイルの切替 |
| `TURSO_CONNECTION_URL` / `TURSO_AUTH_TOKEN` | libSQL 接続 |
| `BETTER_AUTH_SECRET` | セッション Cookie の署名（32文字以上） |
| `BETTER_AUTH_URL` | Better Auth の baseURL。パスキーの rpID / origin もここから導出する |

値は `packages/env/` 直下の env ファイルに置く（worktree では `packages/env/scripts/symlink-env-for-worktree.ts` が生成する）。`apps/api/.env.<env>` は varlock の `@currentEnv` 経由では読まれないため置かない（packages/env/README.md 参照）。

## スクリプト

| コマンド              | 内容                                               |
| --------------------- | -------------------------------------------------- |
| `pnpm run dev`        | Vite dev + workerd（`http://localhost:8787`）      |
| `pnpm run build`      | プロダクションビルド                               |
| `pnpm run preview`    | ビルド成果物を preview                             |
| `pnpm run deploy`     | 本番ビルド + `varlock-wrangler deploy`             |
| `pnpm run cf-typegen` | `worker-configuration.d.ts` を生成（varlock 経由） |
| `pnpm run test`       | Vitest（workers project + node project）           |
| `pnpm run typecheck`  | `tsc`                                              |

ルートからは `pnpm run dev:api` / `pnpm run deploy:api` で呼ぶ。

## ローカル開発

`pnpm run dev:api` を起動し、`http://localhost:8787/api/auth/get-session` などへ直接リクエストする。`/api/auth/*` は Worker 内の Better Auth が処理するため、`apps/web` を起動しなくても認証 API 単体で確認できる。

テストは 2 構成。

- `workers` project（`src/**/*.test.ts`）: `@cloudflare/vitest-plugin` で workerd 上で実行。`createApp` に stub を差し込み、oRPC client / Hono の `app.request` でルートを検証する。
- `node` project（`src/**/*.integration.test.ts`）: 実 libSQL（`file::memory:?cache=shared`）+ `@pantry/db/migrations` で本物の `createAuth` を組み立て、Cookie セッションが通ることを検証する。

## 現状の位置づけ（PR 3 まで）

この PR ではブラウザの通信経路は変わらない。`apps/web` は引き続き

- 自身の `/api/rpc`（`apps/web/src/rpc/`）
- 自身がホストする Better Auth（`apps/web/auth.ts` / `src/features/auth/server/get-auth.server.ts`）

で動く。両者は同じ `packages/db` のテーブルと `BETTER_AUTH_SECRET` を共有するため、Cookie セッションは互いに互換（web でサインインしたセッションを api が読める）。

PR 3 で `apps/web` の `/rpc/*` と `/api/auth/*` を Service Binding 経由でこの Worker へプロキシし、web 側の Better Auth と `/api/rpc` は撤去する。`apps/api/src/auth/passkey-plugin-options.ts` は PR 3 まで web 側と同じ内容を二重に持つ。

## 今後の認証（Bearer / OAuth）

`src/auth/session.ts` の `authenticateRequest` は authenticator を順に試す port。現在は Better Auth の Cookie セッションだけ。MCP / Chrome 拡張 / Raycast のような外部クライアント向けに、OAuth の access token を Bearer で受ける authenticator をあとから配列へ足す。contract の `me` は変えずに済む。
