# テスト方針

## 1. 目的

- MVPの主要要件（認証、CRUD、検索、タグAND/OR、並び順）の回帰を防ぐ。
- TypeSpec契約と実装の乖離を早期検出する。
- 仕様として確定した `409 Conflict` と `PATCH note: null` の挙動を保証する。

## 2. 品質ゲート

- ゲート1: TypeSpecが `warning/error なし` でコンパイルできること
- ゲート2: APIレイヤーの主要統合テストが成功すること
- ゲート3: 主要ユーザーフローE2Eが成功すること
- ゲート4: 受け入れ条件（本ドキュメント 5章）がすべて満たされること

## 3. テスト対象

- 認証（Better Auth）
- ブックマーク CRUD
- URLタイトル自動取得（成功/失敗）
- タグ処理（正規化、重複除去、上限制約）
- 検索（キーワード）
- タグ絞り込み（AND / OR）
- 並び順（新着順 / 更新順）
- APIエラー契約（400/401/404/409）
- 画面遷移（一覧、詳細、登録/編集、設定）

## 4. テストレベル

### 4.1 Contract（TypeSpec/OpenAPI）

- `TEST-CON-001`: `packages/api-spec/main.tsp` が `warning/error なし` でコンパイルできる
  - `node packages/api-spec/node_modules/.bin/tsp compile packages/api-spec/main.tsp --emit @typespec/openapi3 --warn-as-error`
- `TEST-CON-002`: OpenAPI出力に `POST/PATCH` の `409` が含まれる
- `TEST-CON-003`: OpenAPI出力に `securitySchemes`（Cookie/Bearer）が含まれる
- `TEST-CON-004`: OpenAPI出力で `PATCH` の `note` が `nullable` である
- `TEST-CON-005`: `limit` の制約（default=20, min=1, max=100）が契約に含まれる
- `TEST-CON-006`: `error.code` の列挙値が契約に含まれる
- `TEST-CON-007`: `InvalidCursorError` / `CursorMismatchError` が契約に含まれる
- `TEST-CON-008`: `BookmarkSummary.id` が UUID v7 制約（`uuid` + version 7 pattern）で契約化されている
- `TEST-CON-009`: `createdAt` / `updatedAt` が `utcDateTime` として契約化されている
- `TEST-CON-010`: `tagMode` の default が `and` として契約化されている
- `TEST-CON-011`: `GET /v1/tags/suggest` の `limit` 制約（default=10, min=1, max=20）が契約に含まれる
- `TEST-CON-012`: `GET /v1/bookmarks` の `tags` クエリが繰り返し形式（`tags=a&tags=b`。OpenAPI上は `explode=true` の明示またはデフォルト適用）として契約化されている
- `TEST-CON-013`: `ListBookmarksOk.nextCursor` が「必須キー + nullable（`string | null`）」として契約化されている

### 4.2 Unit

- `TEST-UNIT-001`: タグ正規化で `trim + 小文字化` が適用される
- `TEST-UNIT-002`: タグ正規化で空文字が拒否される
- `TEST-UNIT-003`: タグ正規化で32文字超過が拒否される
- `TEST-UNIT-004`: タグ配列で同一ブックマーク内重複が除去される
- `TEST-UNIT-005`: タグ配列で20件超過が拒否される
- `TEST-UNIT-006`: 並び順変換 `newest/updated` が正しいSQL条件に変換される
- `TEST-UNIT-007`: URL重複判定前の正規化（`trim`）が正しく適用される
- `TEST-UNIT-008`: URL正規化で `scheme/host` 小文字化・デフォルトポート除去が適用される
- `TEST-UNIT-009`: URL正規化で `fragment` 除去・末尾 `/` ルールが適用される
- `TEST-UNIT-010`: URL正規化でクエリ順序は保持され、`http` と `https` は別扱いになる

### 4.3 Integration（DB含む）

- `TEST-INT-001`: ブックマーク作成時にタグが正しく永続化される
- `TEST-INT-002`: 同一ユーザー内でタグが再利用される（`tags`重複作成なし）
- `TEST-INT-003`: URL重複時に `409` が返る
- `TEST-INT-004`: `PATCH note: null` で `note` がNULLになる
- `TEST-INT-005`: キーワード検索（`title/url/note`）が機能する
- `TEST-INT-006`: タグ `AND` フィルタ結果が正しい
- `TEST-INT-007`: タグ `OR` フィルタ結果が正しい
- `TEST-INT-008`: 新着順（`created_at desc`）が正しい
- `TEST-INT-009`: 更新順（`updated_at desc`）が正しい
- `TEST-INT-010`: タイトル自動取得失敗時も保存可能
- `TEST-INT-011`: 未認証リクエストで `401` が返る
- `TEST-INT-012`: 一覧APIで `limit` 未指定時に20件返る
- `TEST-INT-013`: 一覧APIで `limit>100` は `400 INVALID_INPUT` になる
- `TEST-INT-014`: 終端ページで `nextCursor` が `null` になる
- `TEST-INT-015`: 壊れたcursorで `400 INVALID_CURSOR` になる
- `TEST-INT-016`: sort/filter不一致cursorで `400 CURSOR_MISMATCH` になる
- `TEST-INT-017`: タイトル取得でタイムアウト時も登録成功し、保存継続される
- `TEST-INT-018`: 新規作成時の `id` が UUID v7 形式で保存される
- `TEST-INT-019`: `created_at` / `updated_at` が UTC で保存され、APIでUTCとして返却される
- `TEST-INT-020`: `tags=a&tags=b` 形式で複数タグ指定できる
- `TEST-INT-021`: `tagMode` 未指定時に `AND` と同じ結果になる
- `TEST-INT-022`: タグ変更を伴う更新で `updated_at` が更新される
- `TEST-INT-023`: `DELETE` 実行時に `deleted_at` が設定され、一覧/詳細から除外される
- `TEST-INT-024`: `GET /v1/tags/suggest` で `limit` 未指定時は10件上限で返る
- `TEST-INT-025`: `GET /v1/tags/suggest` で `limit>20` は `400 INVALID_INPUT` になる
- `TEST-INT-026`: タグ補完結果が `prefix一致 -> count desc -> name asc` の順で返る
- `TEST-INT-027`: `GET /v1/tags/suggest` で `q` がtrim後空文字なら `400 INVALID_INPUT` になる
- `TEST-INT-028`: 想定外例外時に共通ハンドラで `500 INTERNAL_ERROR` を返し、スタックトレースを含まない
- `TEST-INT-029`: `GET /v1/bookmarks?tags=a,b` のCSV形式は `400 INVALID_INPUT` になる
- `TEST-INT-030`: `sort=newest` で同一 `created_at` のレコードが `id desc` で安定ソートされ、cursorページングで重複・欠落が発生しない
- `TEST-INT-031`: `sort=updated` で同一 `updated_at` のレコードが `id desc` で安定ソートされ、cursorページングで重複・欠落が発生しない
- `TEST-INT-032`: 一覧APIレスポンスで `nextCursor` キーが常に存在し、非終端では `string`、終端では `null` になる

### 4.4 E2E

- `TEST-E2E-001`: ログイン -> 一覧アクセス
- `TEST-E2E-002`: URL登録 -> タイトル取得 -> 保存 -> 一覧反映
- `TEST-E2E-003`: 一覧 -> 詳細 -> 編集 -> 更新順で先頭表示
- `TEST-E2E-004`: タグ複数指定で AND / OR 切替時の結果差分
- `TEST-E2E-005`: URL重複登録時にエラー表示（`409` 対応）
- `TEST-E2E-006`: `note` 削除操作が `null` 更新として反映
- `TEST-E2E-007`: 設定画面への遷移と表示
- `TEST-E2E-008`: 一覧の「続きを読む」でcursorページングが継続動作する
- `TEST-E2E-009`: 不正cursor時に適切なエラー扱い（再読み込み/通知）になる
- `TEST-E2E-010`: 削除後のブックマークが一覧に表示されず、詳細へ遷移できない
- `TEST-E2E-011`: 作成/更新日時が `Asia/Tokyo` で表示される

## 5. 受け入れ条件（MVP）

1. `REQ-AUTH-001`: 未認証ユーザーは主要画面へアクセス不可。
2. `REQ-SCREEN-001`: 認証後に一覧、詳細、登録/編集、設定へ遷移可能。
3. `REQ-BOOK-002`: URL貼り付けでタイトル自動取得が試行される。
4. `REQ-BOOK-002`: タイトル取得失敗時も手入力で保存可能。
5. `REQ-TAG-001`: タグは正規化（trim+小文字化）されて保存される。
6. `REQ-TAG-002`: タグ上限（20件）と文字数上限（32文字）が適用される。
7. `REQ-SEARCH-001`: キーワード検索が `title/url/note` を対象に動作する。
8. `REQ-TAG-003`: タグ絞り込みの AND / OR が正しく動作する。
9. `REQ-SORT-001`: 並び順（新着順/更新順）切替が正しく動作する。
10. `REQ-BOOK-003`: 同一ユーザー内URL重複時は `409 Conflict` を返す。
11. `REQ-BOOK-004`: `PATCH note: null` でメモ削除（NULL化）ができる。
12. `REQ-PAGE-001`: cursorページング（default/max/終端null）で `nextCursor` キーを常に返し、同一時刻タイ時の `id desc` 安定順序が仕様どおり動作する。
13. `REQ-URL-001`: URL正規化ルールに基づいて重複判定される。
14. `REQ-FETCH-001`: タイトル取得ポリシー（timeout/redirect/size/SSRF）を満たす。
15. `REQ-ERR-001`: `error.code` が標準列挙に従って返る。
16. `REQ-ID-001`: エンティティIDが UUID v7 である。
17. `REQ-TIME-001`: `created_at` / `updated_at` が UTC で保存・返却される。
18. `REQ-QUERY-001`: `tags` クエリは `tags=a&tags=b` 形式のみ受け付け、`tags=a,b` は拒否する。
19. `REQ-BOOK-005`: `DELETE` がソフトデリートとして機能する。
20. `REQ-TIME-002`: UIでの日時表示が `Asia/Tokyo` である。
21. `REQ-TAG-004`: タグ補完が `q/limit/並び順` 仕様どおり動作する。
22. `REQ-ERR-002`: 想定外例外時の `500` が共通ハンドラ方針どおり動作する。

## 6. テストデータ方針

- 固定ユーザー1件を基本とする。
- 検索検証用に以下の差分データを準備:
  - タイトル一致のみ
  - URL一致のみ
  - メモ一致のみ
  - タグ単一一致
  - タグ複数一致（AND検証用）
- 日時差分データを用意し、並び順を検証する。
- 同一 `created_at` / `updated_at` のデータを用意し、`id desc` の安定ソートを検証する。
- 競合検証用に同一URLデータを準備（`trim`差異を含む）

## 7. 回帰観点（重点）

- タグ正規化ロジック変更時:
  - 既存データとの互換性
  - 検索結果件数の不整合
- 検索クエリ変更時:
  - AND / OR 条件崩れ
  - 並び順とフィルタ併用時の崩れ
- 認証まわり変更時:
  - セッション切れ時のアクセス制御
  - Cookie/Bearerの認可境界崩れ
- API契約変更時:
  - `main.tsp` と実装差分
  - OpenAPIの破壊的変更混入

## 8. 実行運用（暫定）

- Contractテスト:
  - `node packages/api-spec/node_modules/.bin/tsp compile packages/api-spec/main.tsp --emit @typespec/openapi3 --warn-as-error`
- フロントエンド単体テスト:
  - `bun --bun run test`（`apps/frontend`）
- E2E:
  - 導入後は pull request ごとにCI実行
- 推奨CI順序:
  1. Contract
  2. Unit/Integration
  3. E2E

## 9. 要件トレーサビリティ（REQ -> TEST）

| 要件ID | 要件概要 | 対応テストID |
| --- | --- | --- |
| `REQ-AUTH-001` | 未認証拒否 | `TEST-INT-011`, `TEST-E2E-001` |
| `REQ-AUTH-002` | Cookie + Bearer 契約定義 | `TEST-CON-003` |
| `REQ-AUTH-003` | Better Authセッション詳細は実装時確定 | `TBD (認証実装時に追加)` |
| `REQ-BOOK-001` | ブックマークCRUD | `TEST-INT-001`, `TEST-E2E-002`, `TEST-E2E-003` |
| `REQ-BOOK-002` | タイトル自動取得（失敗時フォールバック含む） | `TEST-INT-010`, `TEST-E2E-002` |
| `REQ-BOOK-003` | URL重複時 `409` | `TEST-CON-002`, `TEST-INT-003`, `TEST-E2E-005` |
| `REQ-BOOK-004` | `PATCH note: null` で削除 | `TEST-CON-004`, `TEST-INT-004`, `TEST-E2E-006` |
| `REQ-BOOK-005` | ソフトデリート | `TEST-INT-023`, `TEST-E2E-010` |
| `REQ-ID-001` | UUID v7 ID | `TEST-CON-008`, `TEST-INT-018` |
| `REQ-QUERY-001` | `tags` 繰り返しクエリ形式 | `TEST-CON-012`, `TEST-INT-020`, `TEST-INT-029` |
| `REQ-TAG-001` | タグ正規化（trim + lowercase） | `TEST-UNIT-001`, `TEST-INT-001` |
| `REQ-TAG-002` | タグ制約（20件/32文字/空文字/重複） | `TEST-UNIT-002`, `TEST-UNIT-003`, `TEST-UNIT-004`, `TEST-UNIT-005` |
| `REQ-TAG-003` | タグ AND / OR（default and） | `TEST-CON-010`, `TEST-INT-006`, `TEST-INT-007`, `TEST-INT-021`, `TEST-E2E-004` |
| `REQ-TAG-004` | タグ補完（q/limit/並び順） | `TEST-CON-011`, `TEST-INT-024`, `TEST-INT-025`, `TEST-INT-026`, `TEST-INT-027` |
| `REQ-SEARCH-001` | キーワード検索対象 | `TEST-INT-005` |
| `REQ-SORT-001` | 新着順/更新順 | `TEST-UNIT-006`, `TEST-INT-008`, `TEST-INT-009`, `TEST-E2E-003` |
| `REQ-TIME-001` | UTCタイムスタンプ | `TEST-CON-009`, `TEST-INT-019` |
| `REQ-TIME-002` | UI表示TZ（Asia/Tokyo） | `TEST-E2E-011` |
| `REQ-SCREEN-001` | 必須画面提供 | `TEST-E2E-001`, `TEST-E2E-002`, `TEST-E2E-007` |
| `REQ-DATA-001` | D1永続化・2環境運用 | `TEST-INT-001`, `TEST-INT-002` |
| `REQ-OPS-001` | TypeSpec SSOT・OpenAPI生成 | `TEST-CON-001` |
| `REQ-PAGE-001` | cursorページング仕様 | `TEST-CON-005`, `TEST-CON-013`, `TEST-INT-012`, `TEST-INT-014`, `TEST-INT-030`, `TEST-INT-031`, `TEST-INT-032`, `TEST-E2E-008` |
| `REQ-URL-001` | URL正規化重複判定 | `TEST-UNIT-008`, `TEST-UNIT-009`, `TEST-UNIT-010`, `TEST-INT-003` |
| `REQ-FETCH-001` | タイトル取得ポリシー | `TEST-INT-017` |
| `REQ-ERR-001` | `error.code` 標準化 | `TEST-CON-006`, `TEST-INT-013`, `TEST-INT-015`, `TEST-INT-016` |
| `REQ-ERR-002` | `500` 共通運用 | `TEST-INT-028` |
