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

procedure の追加は `packages/api-contract/src/<機能>.ts` と `src/rpc/<機能>.ts`（`tags` / `bookmarks`）の両方に足す。contract を満たさない実装は型エラーになる。サインインが必要な procedure は contract を `authed` から作り、実装は `kit.requireAuthWithDb` を通す（context に `user` / `userId` / `db` が入る）。DB を使わない procedure は `kit.requireAuth`（`user` / `userId` のみ）、認証も DB も要らない `health` はどちらも通さない。

`/rpc/*` は POST だけを受け付ける（他のメソッドは procedure に届かず 405、`Allow: POST`。oRPC の client は POST しか送らない）。CSRF 対策として、POST のうち form として送れる content-type（`application/x-www-form-urlencoded` / `multipart/form-data` / `text/plain` / content-type なし）を Hono の `csrf()` で検査し（`src/app.ts`）、`Sec-Fetch-Site: same-origin` か `Origin` が `BETTER_AUTH_URL` の Origin と完全一致するときだけ通す。それ以外は 403（plain text の `Forbidden`）。`same-site` は許さない（`*.workers.dev` の兄弟 Worker が same-site になるため）。`application/json` は CORS preflight が要るので検査しない（SSR の Service Binding 経由の呼び出しもこれ）。`BETTER_AUTH_URL` が無い・不正なら `/rpc` は 500 で閉じる。`x-csrf-token` ヘッダーはもう要らない（web の client は api を戻せるよう当面付け続ける）。`/api/auth/*` には掛けない（better-auth が trustedOrigins で検査する）。

### テスト

- `src/test/rpc-harness.ts`: Testcontainers の libSQL（`db` project の globalSetup が起動）と、`actor` / `other` / 未認証を切り替えて `/rpc` を叩く client。procedure の behaviour テスト（所有者の分離・401・別サイトからの form の 403）は `src/rpc/**/*.integration.test.ts`（`db` project）でこれを使う。
- `pnpm --filter @pantry/api run test:db`: 実際の libSQL server（testcontainers、Docker が必要）に本番 migration を適用した DB テスト。`src/features/**/db/` の adapter、`src/test/db/` の横断シナリオ、`src/rpc/**` の procedure behaviour、`src/auth/**` の Cookie セッションを同じコンテナで回す。CI の `db-integration` job が root の `pnpm run test:db` で回す。

## 環境変数

`packages/env/`（`@pantry/env`）の値を読む。Worker runtime では `cloudflare:workers` の `env` binding として読む。

| キー | 用途 |
| --- | --- |
| `APP_ENV` | `development` / `test` のときだけ `x-forwarded-for` を信用する（本番は `cf-connecting-ip` のみ） |
| `TURSO_CONNECTION_URL` / `TURSO_AUTH_TOKEN` | libSQL 接続 |
| `BETTER_AUTH_SECRET` | セッション Cookie の署名（32文字以上） |
| `BETTER_AUTH_URL` | Better Auth の baseURL。パスキーの rpID / origin と、`/rpc` の CSRF 検査で信頼する Origin もここから導出する |

キーの型は、secrets の4つ（`TURSO_CONNECTION_URL` / `TURSO_AUTH_TOKEN` / `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL`）が `wrangler.jsonc` の `secrets.required` から `wrangler types` の生成物（`worker-configuration.d.ts`）に出る。`APP_ENV` は `vars` を `wrangler.jsonc` に置かないため生成物に現れず、`src/env.d.ts` が持つ。

値は `packages/env/` 直下の env ファイルに置く（`.env.development.example` をコピーする。worktree 固有の上書きは `scripts/symlink-env-for-worktree.ts` が `.env.development.local` に生成する）。`pnpm dev` では `vite.config.ts` が `workerVars()` の結果を wrangler の `vars` として渡す。本番の値は CI が wrangler-action の `secrets` / `vars` で渡す（`.github/workflows/workflow.yaml`）。

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `pnpm run dev` | Vite dev + workerd（`http://localhost:8787`） |
| `pnpm run build` | プロダクションビルド |
| `pnpm run preview` | ビルド成果物を preview |
| `pnpm run deploy` | 本番ビルド + `wrangler deploy --keep-vars`（値は CI が wrangler-action の `secrets` / `vars` で渡す。手元から実行するなら `wrangler deploy --var` / `--secrets-file` で明示する） |
| `pnpm run cf-typegen` | `worker-configuration.d.ts` を生成 |
| `pnpm run db:seed` | 開発DBへ seed（`scripts/seed.ts`。DB を全削除してから投入する。ルートの `pnpm run db:seed` から呼ぶ。env は `packages/env` から `scripts/auth.ts` が読む） |
| `pnpm run db:create-user` | 開発用ユーザーだけを作る（`scripts/create-user.ts`。既にあれば何もしない） |
| `pnpm run test` | Vitest（workers project + node project。Docker 不要） |
| `pnpm run test:db` | `db` project（Testcontainers + 実 libSQL。Docker が必要） |
| `pnpm run typecheck` | `tsc` |

ルートからは `pnpm run dev:api` / `pnpm run deploy:api` で呼ぶ。

## ローカル開発

`pnpm run dev:api` を起動し、`http://localhost:8787/api/auth/get-session` などへ直接リクエストする。`/api/auth/*` は Worker 内の Better Auth が処理するため、`apps/web` を起動しなくても認証 API 単体で確認できる。

テストは 3 構成。設定はすべて `vitest.config.ts` に集約している。

- `workers` project（`src/**/*.test.ts`）: `@cloudflare/vitest-plugin` で workerd 上で実行。`createApp` に stub を差し込み、oRPC client / Hono の `app.request` でルートを検証する。
- `node` project（`src/**/*.integration.test.ts` のうち `db` project 以外）: `node:fs` を使う静的なソース境界検査（`src/test/source-boundary.integration.test.ts`）。
- `db` project（`src/**/db/**`、`src/rpc/**`、`src/auth/**` の `*.integration.test.ts`）: Testcontainers の libSQL server に本番 migration を適用し、DB adapter の DB semantics、`/rpc` の procedure behaviour（`src/test/rpc-harness.ts`）、Better Auth の Cookie セッションを検証する。プロジェクトの globalSetup でコンテナを 1 つ起動し、直列に実行する。

## web からの経路

ブラウザはこの Worker に直接到達しない（`workers_dev: false`）。`apps/web` の Worker entry（`apps/web/src/server.ts`）が `/rpc/*` と `/api/auth/*` を受け、元の Request をそのまま Service Binding（`env.API`）でこの Worker へ渡す。Cookie・Origin・`Set-Cookie` はそのまま往復するので、`BETTER_AUTH_URL` は web の公開 URL と一致させる（パスキーの rpID / origin もここから導く）。

web の SSR / server function は `apps/web/src/api/client.server.ts` の oRPC client（fetch は `env.API.fetch`、受けたリクエストの Cookie を転送）で `me` を呼び、session を得る。web は Better Auth の server instance を持たない。web の既存機能（ブックマーク・タグなど）は移行中で、当面は web 自身の `/api/rpc` と DB の直接読み書きで動く。

`pnpm run dev`（web）は `@cloudflare/vite-plugin` の `auxiliaryWorkers` でこの Worker も同時に起動し、本物の `env.API` binding で繋ぐ。単体で確認するときは `pnpm run dev:api` を使う。

## 今後の認証（Bearer / OAuth）

`src/auth/session.ts` の `authenticateRequest` は authenticator を順に試す port。現在は Better Auth の Cookie セッションだけ。MCP / Chrome 拡張 / Raycast のような外部クライアント向けに、OAuth の access token を Bearer で受ける authenticator をあとから配列へ足す。contract の `me` は変えずに済む。
