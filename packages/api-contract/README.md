# @pantry/api-contract

Pantry API の oRPC contract（contract-first）。procedure の input / output / 型付きエラーだけを持ち、実装は `apps/api` が担当する。client（`apps/web/src/api/`）はこの contract から `ContractRouterClient` を導出して使う。

ビルドは行わず、`packages/db` と同じく TypeScript のソースをそのまま公開する。`composite` / project references は有効にしていない。消費側は workspace link 越しに bundler resolution で `.ts` を解決する（`vite` のビルドも `tsc --noEmit` もこの前提で動く）。

## エクスポート

| specifier | 内容 |
| --- | --- |
| `@pantry/api-contract` | `contract`（`oc` のルーター定義）と型 `ApiContract` |
| `@pantry/api-contract/schemas/*` | `src/schemas/` 配下の schema と型（例: `schemas/session-user`、web の画面と api の両方が使う `schemas/tag-values` / `schemas/bookmark-values`） |

barrel file を避けるため、`schemas` のまとめエクスポートは持たない。schema 単位で import する。

## procedures

| procedure | input | output | 認証 | 型付きエラー |
| --- | --- | --- | --- | --- |
| `health` | なし | `{ status: "ok" }` | 不要 | なし |
| `me` | なし | `{ email, id, name }` | Cookie セッション必須 | `UNAUTHORIZED`（401） |

`tags.*` / `bookmarks.*` は web の `/api/rpc` から機能ごとに移行する（`src/tags.ts` / `src/bookmarks.ts`）。

すべての procedure は CSRF 対策として `x-csrf-token: orpc` ヘッダーを要求する（`apps/api` の `SimpleCsrfProtectionHandlerPlugin`。oRPC client は `SimpleCsrfProtectionLinkPlugin` で付ける。無いと 403 `CSRF_TOKEN_MISMATCH`）。

ID や branded 型は wire に載せず、primitive だけを返す（`docs/architecture.md` の procedure 契約と同じ方針）。

## procedure の追加方法

1. 機能のファイル（`src/tags.ts` / `src/bookmarks.ts`。新しい機能なら新しいファイルを作って `src/contract.ts` に繋ぐ）に `oc` の項目を足す。input / output は Valibot schema（Standard Schema 経由）で書く。
2. output に載せる共有の形は `src/schemas/` にモジュールを分けて置き、`package.json` の `exports` で公開する。
3. 認証が要る procedure は `src/base.ts` の `authed` から作る（`UNAUTHORIZED`（401）を宣言済み）。実装（`apps/api`）は `requireAuth` middleware を通す。
4. `apps/api/src/rpc/` の同じ機能のファイルに実装を足す。contract を満たさない実装は型エラーになる。

## 今後の認証

現在の `me` は Better Auth の Cookie セッションだけを前提にしている。将来 MCP / Chrome 拡張 / Raycast のような外部クライアント向けに OAuth の access token を Bearer で受ける authenticator を `apps/api` の認証 port に追加する。そのときこの contract の output は変えず、401 の宣言だけを共有する。
