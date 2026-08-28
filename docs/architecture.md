# アーキテクチャ方針

## 1. 目的とスコープ（MVP）

- 対象ユーザー: 自分専用。アカウントはCLIで事前作成する。
- 主機能:
  - メールアドレス・パスワードによるサインイン
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
- データ一貫性: procedureの入力検証、Applicationのタグ正規化、persistence adapterのトランザクションで守る。
- 責務分離: Applicationはtransportと永続化実装をimportしない。必要な能力はnarrow function portとして宣言する。

## 3. システム構成

- UI/SSR: TanStack Start（`src/routes/`、`src/router.tsx`）
- API境界: oRPC procedure（`src/rpc/create-app-router.ts`）。`RPCHandler`が`/api/rpc`で待ち受ける。
- RPC client: browserは`RPCLink`で`${origin}/api/rpc`へ、SSRは同一processのhandlerへCookieを転送して直接流す（`src/rpc/client.ts`、`src/rpc/ssr-rpc-fetch.server.ts`）。両者とも同じ`AppRouter`型とTanStack Query keyを使う。
- 認証: Better AuthのCookieセッション。procedureは`getSession(headers)`で検証する。
- DB: Turso Cloud。Drizzle ORMと`@libsql/client`で接続する。server実装はclient bundleに混ざらない。
- Worker環境変数: `TURSO_CONNECTION_URL`、`TURSO_AUTH_TOKEN`、`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`
- DBマイグレーション: Drizzleの生成物をTursoへ適用する。D1 bindingは使わない。

## 4. データアクセス境界（oRPC）

### procedure契約

| 分類             | 表現                                                                                            | HTTP      |
| ---------------- | ----------------------------------------------------------------------------------------------- | --------- |
| 未認証           | `UNAUTHORIZED`                                                                                  | 401       |
| input validation | oRPC validation error（`BAD_REQUEST`等）                                                        | 4xx       |
| 衝突・対象なし   | procedure-specific defined error（例: `tag-name-already-exists` 409、`bookmark-not-found` 404） | 409 / 404 |
| 未知障害         | throw                                                                                           | 500       |

- Unknown Errorを握りつぶさない。procedureはcatchせず500として抜け、内部messageやcauseをclientへ返さない。
- UIは`ORPCError.code`だけを表示メッセージへ写す（`get-*-error-message.ts`）。`UNAUTHORIZED`はnullを返し、client interceptorのsign-in redirectと二重表示しない。
- branded ID（`TagId`等）はwire出力に載せない。procedure出口でprimitiveへ戻す。

### Applicationとquery service

- Mutation（CreateTag、DeleteBookmark等）のApplicationはnarrow function portだけに依存し、Result/判別unionのExpected Errorをdefined errorへ写すのはprocedure側。
- 単純read（一覧、詳細）はUseCaseを作らず、Drizzleを閉じ込めたquery service（`src/features/*/persistence/`）が`UserId`とvalidation済みinputを受け、画面に要るprojectionだけを返す。timestampはISO文字列、対象なしはnull（procedureが404へ変換）。

### TanStack Query ownership

- route loaderはcomponentと同じquery options工場（`bookmarkListQueryOptions`、`bookmarkDetailQueryOptions`等）でprefetchし、componentは同じcacheを読む。
- ブックマーク一覧は`useSuspenseInfiniteQuery`でページを蓄積する。query keyは`q` / `tags` / `tagMode` / `sort`のみ。cursorはpageParam。
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
- 一覧は削除済みを除外する。`q`はタイトル、URL、メモを部分一致検索する。
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
- 本番では`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`、信頼するオリジンを明示する。Cookieは`HttpOnly`、`Secure`、`SameSite`を前提とする。

## 9. MVP外

- ブラウザ拡張からの直接登録
- OAuth、パスキー、アカウント自己管理
- 高度検索、タグエイリアス/マージ、URL canonicalization
- 外部クライアント向けのHTTP API
