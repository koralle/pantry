# アーキテクチャ方針

## 1. 目的とスコープ（MVP）

- 対象ユーザー: 自分専用（シングルユーザー運用）
- 主機能:
  - Better Auth を用いた認証（パスワード / OAuth / パスキー）
  - URL貼り付けによるタイトル自動取得
  - ブックマーク CRUD
  - キーワード検索
  - タグ絞り込み（AND / OR）
  - 並び順（新着順 / 更新順）
- 必須画面:
  - 一覧
  - 詳細
  - 登録 / 編集
  - 設定
- 永続化: Cloudflare D1

## 2. 設計原則

- 契約先行: API仕様は TypeSpec を唯一の仕様源（SSOT）として管理する
- 単純性優先: MVPは最小構成で価値を出し、拡張点は契約に残す
- 破壊的変更回避: `/v1` を起点に将来の互換性を保つ
- データ一貫性: バリデーション、正規化、一意制約をAPI境界で保証する

## 3. システム構成

- フロントエンド: `apps/frontend`（TanStack Start + React）
- バックエンド: `apps/backend`（Hono + Cloudflare Workers）
- 認証: Better Auth（バックエンドで一元管理）
- DB: Cloudflare D1
- API 契約: TypeSpec（`packages/api-spec/main.tsp`）

### 3.1 ランタイム境界

- `frontend` はUIとBFF相当の表示責務に集中
- `backend` は認証、認可、APIバリデーション、永続化責務に集中
- 将来のブラウザ拡張は `backend` の同一API契約を利用する

### 3.2 環境

- D1 は `dev` / `prod` の2環境のみ運用
- 設定値・Secrets は環境単位で分離
- マイグレーションは `dev` 検証後に `prod` 適用

## 4. API契約方針（TypeSpec）

- TypeSpecファイル: `packages/api-spec/main.tsp`
- バージョン: `/v1`
- 認証スキーム:
  - Cookie セッション（`pantry_session`）
  - Bearer（契約先行。MVPで実装必須ではない）
- エラー契約（MVP）:
  - `400 BadRequest`
  - `401 Unauthorized`
  - `404 NotFound`
  - `409 Conflict`

### 4.1 APIルール（MVPで固定）

- `id` は UUID v7 を利用する
- `createdAt` / `updatedAt` は UTC として返す（`utcDateTime`）
- `POST /v1/bookmarks`:
  - 同一ユーザー内でURL重複時は `409 Conflict`
- `PATCH /v1/bookmarks/{bookmarkId}`:
  - `note: null` はメモ削除（NULL化）
  - `tags` 指定時は全置換、未指定時は変更しない
  - タグ内容が変化した場合は `updated_at` を更新する
- `GET /v1/bookmarks`:
  - `q` は `title/url/note` を検索
  - `tags` クエリ形式は `tags=a&tags=b` の繰り返しのみを受け付ける
  - `tags` は最大 `20` 件、各要素は `trim` 後 `1..32` 文字（空文字は `400 INVALID_INPUT`）
  - `tags=a,b` のCSV形式は受け付けず `400 INVALID_INPUT`
  - `tagMode=and|or` でタグ条件を切替（default: `and`）
- `GET /v1/tags/suggest`:
  - `q` は必須。サーバーで `trim` 後、空文字は `400 INVALID_INPUT`
  - `limit` は default `10`、min `1`、max `20`（超過時は `400 INVALID_INPUT`）
  - 並び順は `prefix一致` 優先、次に `count desc`、最後に `name asc`
- `DELETE /v1/bookmarks/{bookmarkId}`:
  - ソフトデリート（`deleted_at` にUTC時刻を記録）を行う
  - ソフトデリート済みレコードは一覧・検索・詳細取得の対象外

### 4.2 cursorページング仕様（MVPで固定）

- `limit`:
  - default: `20`
  - min: `1`
  - max: `100`
- sort別の安定ソートキー:
  - `newest`: `created_at DESC, id DESC`
  - `updated`: `updated_at DESC, id DESC`
- `nextCursor`:
  - レスポンスでは常に `nextCursor` キーを返す
  - opaque文字列（クライアントは中身を解釈しない）
  - 内部情報: `v`, `sort`, `filterHash`, `lastKey`, `lastId`
  - 非終端時は `nextCursor: <opaque string>`、終端時は `nextCursor: null`
- 異常cursor:
  - 破損/改ざんは `400` + `INVALID_CURSOR`
  - 条件不一致（sort/filter変更）は `400` + `CURSOR_MISMATCH`

### 4.3 error.code標準（MVP）

- `INVALID_INPUT` (`400`)
- `UNAUTHORIZED` (`401`)
- `NOT_FOUND` (`404`)
- `URL_CONFLICT` (`409`)
- `INVALID_CURSOR` (`400`)
- `CURSOR_MISMATCH` (`400`)
- `INTERNAL_ERROR` (`500`)
- `500` は共通エラーハンドラで運用し、各APIのTypeSpecレスポンスユニオンには原則明示しない
- `500` レスポンスは `error.code=INTERNAL_ERROR` を返し、スタックトレース等の内部情報は返さない

## 5. ドメインモデル（MVP）

### 5.1 エンティティ

- `bookmarks`
  - `id` (UUID v7, PK)
  - `user_id`
  - `url`
  - `title`
  - `note` (nullable)
  - `created_at` (UTC)
  - `updated_at` (UTC)
  - `deleted_at` (UTC, nullable)
- `tags`
  - `id` (UUID v7, PK)
  - `user_id`
  - `name`（正規化後の値）
  - `created_at` (UTC)
- `bookmark_tags`
  - `bookmark_id`
  - `tag_id`
  - 複合一意制約: (`bookmark_id`, `tag_id`)

### 5.2 制約・インデックス

- URL一意制約:
  - 対象: 同一 `user_id` + 正規化済み `url`
  - 正規化:
    - `trim`
    - URL parse（`http|https` のみ）
    - `scheme` / `host` を小文字化
    - デフォルトポート除去（`http:80`, `https:443`）
    - `fragment`（`#...`）除去
    - 末尾 `/` はルート以外で除去
    - クエリは保持（並び替えしない）
    - `http` と `https` は別URLとして扱う
- タグ一意制約:
  - (`user_id`, `name`) 一意
- 主要インデックス:
  - `bookmarks(user_id, created_at desc)`
  - `bookmarks(user_id, updated_at desc)`
  - `tags(user_id, name)`
  - `bookmark_tags(bookmark_id)`
  - `bookmark_tags(tag_id)`

## 6. タグ仕様（合意済み）

### 6.1 入力方式

- 既存タグ補完あり + 新規作成可
- 補完候補はログインユーザー自身のタグのみ

### 6.2 正規化・制約

- 保存前に `trim` + `小文字化`
- 1ブックマークあたり最大20タグ
- 1タグあたり最大32文字
- 空文字（trim後長さ0）は拒否
- 同一ブックマーク内重複は正規化後に除去

## 7. 主要フロー

### 7.1 URL貼り付け登録

1. URL入力
2. サーバー側でタイトル取得を1回試行（同期）
3. 成功時はタイトル初期値を反映
4. 失敗時は手入力で保存可能

#### タイトル取得ポリシー（MVP固定）

- タイムアウト: `3秒`
- リトライ: なし
- リダイレクト: 最大 `3`
- 最大取得サイズ: `1MB`（title抽出対象は先頭 `64KB`）
- SSRF対策:
  - `http|https` 以外を拒否
  - `localhost` / private / loopback / link-local / metadata IPを拒否
  - DNS解決後IPを検査
  - リダイレクト先も毎回同様に検査

### 7.2 検索・並び順

- 検索対象: `title`, `url`, `note`
- タグ絞り込み:
  - `AND`: 指定タグをすべて含む
  - `OR`: 指定タグのいずれかを含む
- 並び順:
  - 新着順 = `created_at desc`
  - 更新順 = `updated_at desc`

## 8. 画面要件

- 一覧画面:
  - キーワード検索
  - タグ複数選択
  - AND / OR 切替
  - 新着順 / 更新順 切替
  - 作成/更新日時は `Asia/Tokyo` で表示
- 詳細画面:
  - URL / タイトル / メモ / タグ / 作成更新日時
  - 編集・削除導線
  - 作成/更新日時は `Asia/Tokyo` で表示
- 登録 / 編集画面:
  - URL入力
  - タイトル自動取得
  - タイトル手動編集
  - タグ入力（補完 + 新規）
- 設定画面:
  - アカウント関連設定
  - Better Auth 連携状態確認

## 9. セキュリティ方針

- 未認証アクセスは拒否（`401`）
- データアクセスは `user_id` 境界で隔離
- 入力検証は API 境界で実施（長さ、件数、形式）
- Cookie利用時は `HttpOnly`, `Secure`, `SameSite` を前提設定

### 9.1 Better Auth セッション運用（実装時確定）

- MVP時点で固定する前提:
  - 未認証は `401` を返す
  - Cookie は `HttpOnly` / `Secure` / `SameSite` を前提とする
- 実装時に確定する項目:
  - セッション寿命（idle / absolute）
  - セッション再発行（rotation / sliding）の条件
  - CSRF詳細対策
  - セッション失効トリガー（パスワード変更、ログアウトなど）

## 10. 可観測性・運用

- 全書き込みで `created_at` / `updated_at` を UTC で管理
- APIログは request id を付与して追跡可能にする
- API仕様変更は TypeSpec diff と OpenAPI差分でレビューする

## 11. MVP外（将来拡張）

- ブラウザ拡張からの直接登録
- 高度検索（期間・お気に入り・未読）
- タグエイリアス / マージ
- URL canonicalization（重複判定の高度化）

## 12. 要件ID（Traceability）

- `REQ-AUTH-001`: 未認証アクセスは拒否し、認証済みユーザーのみ利用可能
- `REQ-AUTH-002`: API認証スキームとして Cookie セッション + Bearer を契約で定義
- `REQ-AUTH-003`: Better Auth のセッション詳細運用は認証実装タスクで確定する
- `REQ-BOOK-001`: ブックマーク CRUD を提供
- `REQ-BOOK-002`: URL貼り付け時にタイトル自動取得を試行し、失敗時は手入力保存可能
- `REQ-BOOK-003`: 同一ユーザー内 URL 重複は `409 Conflict` を返す
- `REQ-BOOK-004`: `PATCH note: null` でメモ削除（NULL化）できる
- `REQ-BOOK-005`: `DELETE` はソフトデリートとして扱い、`deleted_at` を記録する
- `REQ-ID-001`: すべてのエンティティIDは UUID v7 を利用する
- `REQ-QUERY-001`: `tags` クエリは `tags=a&tags=b` の繰り返し形式のみ受け付け、最大20件・各要素1..32文字（trim後空文字拒否）を満たす
- `REQ-TAG-001`: タグは `trim + 小文字化` で正規化する
- `REQ-TAG-002`: タグ制約（最大20件、1タグ最大32文字、空文字拒否、重複除去）を満たす
- `REQ-TAG-003`: タグ絞り込み `AND / OR` に対応し、未指定時の `tagMode` は `and`
- `REQ-TAG-004`: タグ補完は `q` 必須、`limit`（default10/min1/max20）、`prefix->count->name` 順で返す
- `REQ-SEARCH-001`: キーワード検索対象は `title / url / note`
- `REQ-SORT-001`: 並び順 `newest / updated` に対応する
- `REQ-TIME-001`: `created_at` / `updated_at` は UTC で保存・返却する
- `REQ-TIME-002`: UIでの日時表示は `Asia/Tokyo` を使用する
- `REQ-PAGE-001`: cursorページング（default/max/終端null/不正cursorエラー）に対応する
- `REQ-URL-001`: URL正規化ルール（scheme/host/port/fragment/path）で重複判定する
- `REQ-FETCH-001`: タイトル取得ポリシー（timeout/redirect/size/SSRF）を満たす
- `REQ-ERR-001`: `error.code` を標準列挙値で返す
- `REQ-ERR-002`: `500` は共通エラーハンドラで返し、TypeSpecの各APIレスポンスには原則明示しない
- `REQ-SCREEN-001`: 画面（一覧、詳細、登録/編集、設定）を提供する
- `REQ-DATA-001`: 永続化は Cloudflare D1 を利用し、`dev / prod` 2環境で運用する
- `REQ-OPS-001`: API仕様は TypeSpec を SSOT とし、OpenAPI出力可能である
