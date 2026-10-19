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

procedure の追加は `packages/api-contract/src/<機能>.ts` と `src/rpc/<機能>.ts`（`tags` / `bookmarks`）の両方に足す。contract を満たさない実装は型エラーになる。サインインが必要な procedure は contract を `authed` から作り、実装は `kit.requireAuth` を通す（context に `user` と `userId` が入る）。DB は `kit.deps.db()` で受ける。

`/rpc/*` は POST だけを受け付ける（他のメソッドは procedure に届かず 405、`Allow: POST`。oRPC の client は POST しか送らない）。CSRF 対策として、POST のうち form として送れる content-type（`application/x-www-form-urlencoded` / `multipart/form-data` / `text/plain` / content-type なし）を Hono の `csrf()` で検査し（`src/app.ts`）、`Sec-Fetch-Site: same-origin` か `Origin` が `BETTER_AUTH_URL` の Origin と完全一致するときだけ通す。それ以外は 403（plain text の `Forbidden`）。`same-site` は許さない（`*.workers.dev` の兄弟 Worker が same-site になるため）。`application/json` は CORS preflight が要るので検査しない（SSR の Service Binding 経由の呼び出しもこれ）。`BETTER_AUTH_URL` が無い・不正なら `/rpc` は 500 で閉じる。`x-csrf-token` ヘッダーはもう要らない（web の client は api を戻せるよう当面付け続ける）。`/api/auth/*` には掛けない（better-auth が trustedOrigins で検査する）。

### テスト

- `src/test/rpc-harness.ts`: 本番 migration を適用した libSQL（`file::memory:`）と、`actor` / `other` / 未認証を切り替えて `/rpc` を叩く client。procedure の behaviour テスト（所有者の分離・401・別サイトからの form の 403）は `*.integration.test.ts`（Node project）でこれを使う。
- `pnpm --filter @pantry/api run test:db`: 実際の libSQL server（testcontainers、Docker が必要）に本番 migration を適用した DB テスト。`src/features/**/db/` の adapter と `src/test/db/` の横断シナリオを同じコンテナで回す。CI の `db-integration` job が root の `pnpm run test:db` で web と一緒に回す。

## 環境変数

`packages/env/` の値を `.env.schema` の `@import(..., pick=[...])` で取り込む。Worker runtime では `cloudflare:workers` の `env` binding として読む。

| キー | 用途 |
| --- | --- |
| `APP_ENV` | 読み込む env ファイルの切替 |
| `TURSO_CONNECTION_URL` / `TURSO_AUTH_TOKEN` | libSQL 接続 |
| `BETTER_AUTH_SECRET` | セッション Cookie の署名（32文字以上） |
| `BETTER_AUTH_URL` | Better Auth の baseURL。パスキーの rpID / origin と、`/rpc` の CSRF 検査で信頼する Origin もここから導出する |

値は `packages/env/` 直下の env ファイルに置く（worktree では `packages/env/scripts/symlink-env-for-worktree.ts` が生成する）。`apps/api/.env.<env>` は varlock の `@currentEnv` 経由では読まれないため置かない（packages/env/README.md 参照）。

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `pnpm run dev` | Vite dev + workerd（`http://localhost:8787`） |
| `pnpm run build` | プロダクションビルド |
| `pnpm run preview` | ビルド成果物を preview |
| `pnpm run deploy` | 本番ビルド + `varlock-wrangler deploy` |
| `pnpm run cf-typegen` | `worker-configuration.d.ts` を生成（varlock 経由） |
| `pnpm run db:seed` | 開発DBへ seed（`scripts/seed.ts`。DB を全削除してから投入する。ルートの `pnpm run db:seed` から呼ぶ。env は scripts 専用の `scripts/.env.schema` から読む） |
| `pnpm run db:create-user` | 開発用ユーザーだけを作る（`scripts/create-user.ts`。既にあれば何もしない） |
| `pnpm run test` | Vitest（workers project + node project。Docker 不要） |
| `pnpm run test:db` | `db` project（Testcontainers + 実 libSQL。Docker が必要） |
| `pnpm run typecheck` | `tsc` |

ルートからは `pnpm run dev:api` / `pnpm run deploy:api` で呼ぶ。

## ローカル開発

`pnpm run dev:api` を起動し、`http://localhost:8787/api/auth/get-session` などへ直接リクエストする。`/api/auth/*` は Worker 内の Better Auth が処理するため、`apps/web` を起動しなくても認証 API 単体で確認できる。

テストは 3 構成。設定はすべて `vitest.config.ts` に集約している。

- `workers` project（`src/**/*.test.ts`）: `@cloudflare/vitest-plugin` で workerd 上で実行。`createApp` に stub を差し込み、oRPC client / Hono の `app.request` でルートを検証する。
- `node` project（`src/**/*.integration.test.ts` のうち `db` project 以外）: 実 libSQL（`file::memory:?cache=shared`）+ `@pantry/db/migrations` で本物の `createAuth` を組み立て、Cookie セッションが通ることを検証する。
- `db` project（`src/**/db/**/*.integration.test.ts`）: Testcontainers の libSQL server に本番 migration を適用し、DB adapter の DB semantics を検証する。プロジェクトの globalSetup でコンテナを 1 つ起動し、直列に実行する。

## web からの経路

ブラウザはこの Worker に直接到達しない（`workers_dev: false`）。`apps/web` の Worker entry（`apps/web/src/server.ts`）が `/rpc/*` と `/api/auth/*` を受け、元の Request をそのまま Service Binding（`env.API`）でこの Worker へ渡す。Cookie・Origin・`Set-Cookie` はそのまま往復するので、`BETTER_AUTH_URL` は web の公開 URL と一致させる（パスキーの rpID / origin もここから導く）。

web の SSR / server function は `apps/web/src/api/client.server.ts` の oRPC client（fetch は `env.API.fetch`、受けたリクエストの Cookie を転送）で `me` を呼び、session を得る。web は Better Auth の server instance を持たない。web の既存機能（ブックマーク・タグなど）は移行中で、当面は web 自身の `/api/rpc` と DB の直接読み書きで動く。

`pnpm run dev`（web）は `@cloudflare/vite-plugin` の `auxiliaryWorkers` でこの Worker も同時に起動し、本物の `env.API` binding で繋ぐ。単体で確認するときは `pnpm run dev:api` を使う。

## 今後の認証（Bearer / OAuth）

`src/auth/session.ts` の `authenticateRequest` は authenticator を順に試す port。現在は Better Auth の Cookie セッションだけ。MCP / Chrome 拡張 / Raycast のような外部クライアント向けに、OAuth の access token を Bearer で受ける authenticator をあとから配列へ足す。contract の `me` は変えずに済む。
