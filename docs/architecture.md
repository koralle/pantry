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
- Server Function境界: ブラウザのデータ操作はTanStack Start Server Functionに限定する。独立したHTTP API、TypeSpec、OpenAPIは持たない。
- ユーザー分離: すべてのDB操作で認証済みユーザーIDを条件にする。
- データ一貫性: Server Functionで入力検証、タグ正規化、トランザクションを行う。

## 3. システム構成

- UI/SSR: TanStack Start（`src/routes/`、`src/router.tsx`）
- アプリケーション境界: TanStack Start Server Function（`src/features/`）
- 認証: Better AuthのCookieセッション
- DB: Turso Cloud。Drizzle ORMと`@libsql/client`で接続する。
- Worker環境変数: `TURSO_CONNECTION_URL`、`TURSO_AUTH_TOKEN`、`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`
- DBマイグレーション: Drizzleの生成物をTursoへ適用する。D1 bindingは使わない。

## 4. ドメインモデル

- `bookmarks`: UUID v7のID、`user_id`、URL、タイトル、メモ、UTCの作成/更新/削除日時を持つ。
- `tags`: 既存の整数ID、`user_id`、正規化済み名称、UTCの作成/更新日時を持つ。物置UI向けに `pinned`（棚固定）、`sort_order`（同一グループ内の並び）、`color`（任意の識別色）、`last_used_at`（よく使う箱の並び用）を持つ。
- `bookmark_tags`: ブックマークとタグの多対多を表す。`bookmark_id`と`tag_id`の組み合わせを一意にする。
- 同一ユーザー内でタグ名は一意にする。ブックマークURL重複は登録・更新時に拒否する。

## 5. ブックマーク操作

- 登録・更新はURL、タイトル、メモ、タグ名を受け取る。更新時のタグ指定は全置換する。
- タグ名は`trim + 小文字化`し、空文字、33文字以上、21件以上を拒否する。正規化後の重複は除く。
- 登録・更新ではトランザクションで既存タグを再利用または作成し、中間テーブルを同期する。
- 一覧は削除済みを除外する。`q`はタイトル、URL、メモを部分一致検索する。
- 複数タグはAND/ORを選択できる。新着順/更新順を切り替え、50件ずつ「さらに読み込む」。フィルター変更時は先頭へ戻す。
- 詳細ではURL、タイトル、メモ、タグ、作成/更新日時を表示する。日時は日本時間で表示する。
- 削除は確認後に`deleted_at`を設定するソフトデリートとする。

## 6. タイトル取得

- 登録フォームはURL入力後、手動操作でタイトル取得を実行する。
- サーバー側で`http`/`https`だけを受け付け、`localhost`、loopback、private、link-local、metadata宛てを拒否する。
- リダイレクトは最大3回、タイムアウトは3秒、応答サイズは1MBまでとする。
- 取得したtitleは編集可能な初期値として反映する。取得に失敗しても登録フォームを維持し、手入力保存を可能にする。

## 7. 認証とセキュリティ

- 未認証の保護画面はサインインへリダイレクトする。
- サインアップ画面を提供せず、Better Authの自己登録エンドポイントも無効にする。
- 初期ユーザーはBetter AuthのサーバーAPIを使う専用CLIで作成する。SQLによるパスワードの直接挿入は行わない。
- 本番では`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`、信頼するオリジンを明示する。Cookieは`HttpOnly`、`Secure`、`SameSite`を前提とする。

## 8. MVP外

- ブラウザ拡張からの直接登録
- OAuth、パスキー、アカウント自己管理
- 高度検索、タグエイリアス/マージ、URL canonicalization
- 外部クライアント向けのHTTP API
