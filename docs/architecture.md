# アーキテクチャ方針

## 1. 目的とスコープ（MVP）

- 対象ユーザー: 自分専用。アカウントはCLIで事前作成する。
- 主機能:
  - メールアドレス・パスワード、および登録済みパスキーによるサインイン
  - URLからのタイトル取得と手入力フォールバック
  - URL、タイトル、メモ、タグを持つブックマークの登録・表示・編集・削除
  - キーワード検索、タグ複数選択のAND/OR絞り込み、新着順/更新順
- 必須画面: 一覧、詳細、登録、編集、設定、サインイン
- デプロイ先: Cloudflare Workers
- 永続化: Turso Cloud

## 2. 設計原則

- 単純性優先: 日常利用に必要な一連の操作を先に完成させる。
- oRPC境界: ブラウザとSSRの全データ経路はoRPC契約（`/api/rpc`）を通る。独立したREST API、TypeSpec、OpenAPIは持たない。
- ユーザー分離: すべてのprocedureは`requireAuth` middlewareを通し、DB操作は認証済みユーザーIDを条件にする。
- データ一貫性: procedureの入力検証、Applicationのタグ正規化、DB adapterのトランザクションで守る。
- 責務分離: Applicationはtransportと永続化実装をimportしない。必要な能力はnarrow function portとして宣言する。

## 3. システム構成

- UI/SSR: TanStack Start（`apps/web/src/routes/`、`apps/web/src/router.tsx`）
- API Worker: Hono + oRPC（`apps/api/src/app.ts`）。contract（`packages/api-contract`）の `/rpc/*` と Better Auth の `/api/auth/*` を提供し、Cloudflare Worker `pantry-api` としてデプロイする。Better Auth の正本構成は `apps/api/src/auth/create-auth.ts`（テーブルは`packages/db`の auth-schema をそのまま使う）。Worker は公開URLを持たず、web の Service Binding（`env.API`）からのみ到達する。
- API境界: oRPC procedure（`apps/web/src/rpc/contract/create-app-router.ts`）。`RPCHandler`が`/api/rpc`で待ち受ける。
- web → api の経路: web の Worker entry（`apps/web/src/server.ts`）が`/rpc/*`と`/api/auth/*`を元の Request のまま`env.API.fetch`で`pantry-api`へ転送し、それ以外を TanStack Start が処理する。web は Better Auth の server instance を持たず、SSR / server function は`apps/web/src/api/client.server.ts`（`env.API.fetch` + Cookie 転送）で`me`を呼んで session を得る。ブラウザ用の api client は`apps/web/src/api/client.ts`（同一 origin の`/rpc`）。
- 移行期: 既存機能（ブックマーク・タグなど）は web の`/api/rpc`と DB の直接読み書きで動き、順次`pantry-api`の contract へ移す。
- RPC client: browserは`RPCLink`で`${origin}/api/rpc`へ、SSRは同一processのhandlerへCookieを転送して直接流す（`apps/web/src/rpc/client/client.ts`、`apps/web/src/rpc/server/ssr-rpc-fetch.server.ts`）。両者とも同じ`AppRouter`型とTanStack Query keyを使う。
- web → api への移行中: 画面の client（`AppClient` = web の`AppRouter` + api の`ApiContract`）は oRPC の`DynamicLink`で、`@pantry/api-contract`にある procedure を`pantry-api`（browser は`/rpc`、SSR は Service Binding）へ、それ以外を web の`/api/rpc`へ振り分ける（`apps/web/src/rpc/client/app-client.ts`）。procedure を api の contract へ移すと、画面の呼び出しと Query key を変えずに切り替わる。移した機能の web 側 procedure（`apps/web/src/rpc/contract/<機能>-procedures.ts`）と配線は空にし、最後の PR で`/api/rpc`ごと消す。
- CSRF: `pantry-api` の`/rpc/*`は POST だけを受け付け（他のメソッドは 405）、form として送れる content-type（content-type なしを含む）を Hono の`csrf()`で検査して、`Sec-Fetch-Site: same-origin`か`Origin`=`BETTER_AUTH_URL`の Origin のときだけ通す（`apps/api/src/app.ts`）。Cookie は`SameSite=Lax`だが、`*.workers.dev`の兄弟 Worker は same-site で Cookie が届くため`same-site`は許さない。JSON は CORS preflight で止まるので検査しない（SSR は Origin の無い JSON）。`/api/auth/*`は better-auth の trustedOrigins に任せる。web の client は api を戻せるよう当面`x-csrf-token`を付け続ける（`SimpleCsrfProtectionLinkPlugin`、撤去は後続）。
- 認証: Better AuthのCookieセッション（`pantry-api`がホスト）。web の procedure は`getSession(headers)`で検証し、その実装は api の`me`を呼ぶ。
- DB: Turso Cloud。Drizzle ORMと`@libsql/client`で接続する。スキーマ・マイグレーション・接続ファクトリ（`createDb`）は`packages/db`（`@pantry/db`）に置き、server実装はclient bundleに混ざらない。
- Worker環境変数: web は`TURSO_CONNECTION_URL`、`TURSO_AUTH_TOKEN`と Service Binding`API`。api は`TURSO_CONNECTION_URL`、`TURSO_AUTH_TOKEN`、`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`
- 環境変数管理: Varlockの`packages/env/.env.schema`を正本とし、関心ごとのスキーマ（`schemas/.env.db`、`schemas/.env.auth`、`schemas/.env.local-libsql`）を`@import`で束ねる。値は`packages/env/.env.development`に置き、`apps/web`・`apps/api`・`packages/db`は自前の`.env.schema`から必要なキーだけを`pick=[...]`で取り込む。`pnpm dev`への注入は`@varlock/cloudflare-integration`が行い、`.dev.vars`は使わない。auxiliary worker として起動する api の env は、`apps/web/vite.config.ts`が`apps/api`の schema で読み直して渡す。
- ローカルlibSQL: git worktreeごとに独立したDockerコンテナを起動する。`TURSO_PORT`と`TURSO_PROJECT`は`packages/env/scripts/symlink-env-for-worktree.ts`が`packages/env/.env.development.local`へ生成する。
- DBマイグレーション: `packages/db`のDrizzle生成物をTursoへ適用する。D1 bindingは使わない。

## 4. データアクセス境界（oRPC）

### procedure契約

| 分類 | 表現 | HTTP |
| --- | --- | --- |
| 未認証 | `UNAUTHORIZED` | 401 |
| input validation | oRPC validation error（`BAD_REQUEST`等） | 4xx |
| 衝突・対象なし | procedure-specific defined error（例: `tag-name-already-exists` 409、`bookmark-not-found` 404） | 409 / 404 |
| 未知障害 | throw | 500 |

- Unknown Errorを握りつぶさない。procedureはcatchせず500として抜け、内部messageやcauseをclientへ返さない。
- UIは`ORPCError.code`だけを表示メッセージへ写す（`get-*-error-message.ts`）。`UNAUTHORIZED`はnullを返し、client interceptorのsign-in redirectと二重表示しない。
- branded ID（`TagId`等）はwire出力に載せない。procedure出口でprimitiveへ戻す。

### Applicationとquery service

- Mutation（CreateTag、DeleteBookmark等）のApplicationはnarrow function portだけに依存し、Result/判別unionのExpected Errorをdefined errorへ写すのはprocedure側。
- 単純read（一覧、詳細）はUseCaseを作らず、Drizzleを閉じ込めたquery service（`apps/api/src/features/*/db/`）が`UserId`とvalidation済みinputを受け、画面に要るprojectionだけを返す。timestampはISO文字列、対象なしはnull（procedureが404へ変換）。

### TanStack Query ownership

- route loaderはcomponentと同じquery options工場（`bookmarkListQueryOptions`、`bookmarkDetailQueryOptions`等）でprefetchし、componentは同じcacheを読む。
- ブックマーク一覧は`useSuspenseInfiniteQuery`でページを蓄積する。query keyは`tags` / `view`のみ。cursorはpageParam。
- 一覧→詳細→一覧では読み込み済みページを再利用するため、list queryは`staleTime: Infinity`。Create / Update / Delete後は`removeQueries`して先頭20件から再構築する。
- mutation成功後のrefreshは`void router.invalidate().catch(console.error)`のbest-effortとし、refresh失敗で成功を覆さない。

### Server Functionの撤廃状況

全Server FunctionのoRPC移行は6 topicのPRで進める。本PR（bookmarks read/delete）で`fetchBookmarks`、`getBookmark`、`deleteBookmark`を撤廃した。残りはauth/tags/bookmarks create・update・title fetchの各topic PRで移行する。

## 5. ドメインモデル

- `bookmarks`: UUID v7のID、`user_id`、URL、タイトル、メモ、UTCの作成/更新/削除日時を持つ。
- `tags`: 既存の整数ID、`user_id`、表記名（`name`）とそこから導出する正規化名（`normalized_name`）、UTCの作成/更新日時を持つ。物置UI向けに `pinned`（棚固定）、`sort_order`（同一グループ内の並び）、`color`（任意の識別色）、`last_used_at`（よく使う箱の並び用）を持つ。
- `bookmark_tags`: ブックマークとタグの多対多を表す。`bookmark_id`と`tag_id`の組み合わせを一意にする。
- 同一ユーザー内でタグの正規化名は一意にする。ブックマークURL重複は登録・更新時に拒否する。

## 6. ブックマーク操作

- 登録・更新はURL、タイトル、メモ、タグIDを受け取る。更新時のタグ指定は全置換する。
- タグ名は表記（trim + NFC、大小は保持）を正本とし、正規化名（表記の小文字化）で重複判定と `?tags=` 照合を行う。空文字、33文字以上の表記、21件以上を拒否する。正規化後の重複は除く。
- 登録・更新では指定されたタグIDの所有を検証し、中間テーブルを同期する。
- 一覧は削除済みを除外する。
- 複数タグはAND/ORを選択できる。新着順/更新順を切り替え、20件ずつ「さらに読み込む」。フィルター変更時は先頭へ戻す。
- 詳細ではURL、タイトル、メモ、タグ、作成/更新日時を表示する。日時は日本時間で表示する。
- 削除は確認後に`deleted_at`を設定するソフトデリートとする。

## 7. タイトル取得

- 登録フォームはURL入力後、手動操作でタイトル取得を実行する。
- サーバー側で`http`/`https`だけを受け付け、`localhost`、loopback、private、link-local、metadata宛てを拒否する。
- リダイレクトは最大3回、タイムアウトは3秒、応答サイズは1MBまでとする。
- 取得したtitleは編集可能な初期値として反映する。取得に失敗しても登録フォームを維持し、手入力保存を可能にする。

## 8. 認証とセキュリティ

- 未認証の保護画面はサインインへリダイレクトする。
- サインアップ画面を提供せず、Better Authの自己登録エンドポイントも無効にする。
- 初期ユーザーはBetter AuthのサーバーAPIを使う専用CLIで作成する。SQLによるパスワードの直接挿入は行わない。
- パスキーはメール + パスワードに加えるログイン手段。登録・一覧・改名・削除は現在の認証済みユーザー自身の資格情報だけを対象にし、サーバーは公開鍵等のみを保持する。
- 本番では`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`、信頼するオリジンを明示する。Cookieは`HttpOnly`、`Secure`、`SameSite`を前提とする。

## 9. MVP外

- ブラウザ拡張からの直接登録
- OAuth、アカウント自己管理
- 高度検索、タグエイリアス/マージ、URL canonicalization
- 外部クライアント向けのHTTP API
