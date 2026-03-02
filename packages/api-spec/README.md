# API Spec (TypeSpec)

`packages/api-spec/main.tsp` は frontend/backend 間の API 契約定義です。

## 対象（MVP）

- `/v1/bookmarks`
- `/v1/tags/suggest`

## メモ

- 認証スキームは `Cookie + Bearer` を契約として明示する（MVP実装はCookie中心）。
- 未認証時は `401` を返す。
- URL重複時（同一ユーザー内）は `409 Conflict` を返す。
- タグはサーバー側で `trim + 小文字化 + 重複除去` を行う。
- タグ入力制約は `最大20件 / 1件32文字`。
- `PATCH /v1/bookmarks/{bookmarkId}` の `note: null` はメモ削除（NULL化）を意味する。
- `PATCH` で `tags` を指定した場合は全置換、未指定の場合は変更しない。
