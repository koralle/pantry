# @pantry/api-contract

Pantry API の oRPC contract（contract-first）。procedure の input / output / 型付きエラーだけを持ち、実装は `apps/api` が担当する。ブラウザ側の client（`apps/web`）は PR 3 以降でこの contract を型として使う。

ビルドは行わず、`packages/db` と同じく TypeScript のソースをそのまま公開する。`composite` / project references は有効にしていない。消費側は workspace link 越しに bundler resolution で `.ts` を解決する（`vite` のビルドも `tsc --noEmit` もこの前提で動く）。

## エクスポート

| specifier | 内容 |
| --- | --- |
| `@pantry/api-contract` | `contract`（`oc` のルーター定義）と型 `ApiContract` |
| `@pantry/api-contract/schemas/*` | `src/schemas/` 配下の schema と型（例: `schemas/session-user`） |

barrel file を避けるため、`schemas` のまとめエクスポートは持たない。schema 単位で import する。

## procedures

| procedure | input | output | 認証 | 型付きエラー |
| --- | --- | --- | --- | --- |
| `health` | なし | `{ status: "ok" }` | 不要 | なし |
| `me` | なし | `{ email, id, name }` | Cookie セッション必須 | `UNAUTHORIZED`（401） |

ID や branded 型は wire に載せず、primitive だけを返す（`docs/architecture.md` の procedure 契約と同じ方針）。

## procedure の追加方法

1. `src/contract.ts` の `contract` に `oc` の項目を足す。input / output は Valibot schema（Standard Schema 経由）で書く。
2. output に載せる共有の形は `src/schemas/` にモジュールを分けて置き、`package.json` の `exports` で公開する。
3. 認証が要る procedure は `.errors({ UNAUTHORIZED: { status: 401 } })` を宣言する。実装（`apps/api`）は middleware の `errors.UNAUTHORIZED()` で投げる。
4. `apps/api` の `createRouter` に実装を足す。contract を満たさない実装は型エラーになる。

## 今後の認証

現在の `me` は Better Auth の Cookie セッションだけを前提にしている。将来 MCP / Chrome 拡張 / Raycast のような外部クライアント向けに OAuth の access token を Bearer で受ける authenticator を `apps/api` の認証 port に追加する。そのときこの contract の output は変えず、401 の宣言だけを共有する。
