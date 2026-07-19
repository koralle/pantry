# Tag Pantry Fields Design

## Goal

物置（Pantry）UI向けに、タグを「棚／箱」として扱うための最小列を `tags` に追加する。UI・Server Function の振る舞い変更はこのPRの対象外。

## Schema Changes

`tags` に以下を追加する。

| Column         | Type                   | Default | Purpose                      |
| -------------- | ---------------------- | ------- | ---------------------------- |
| `pinned`       | boolean (integer)      | `false` | 棚ナビ／玄関で上に固定       |
| `sort_order`   | integer                | `0`     | 同一 pinned グループ内の並び |
| `color`        | text, nullable         | `null`  | 箱／チップの任意識別色       |
| `last_used_at` | timestamp_ms, nullable | `null`  | よく使う箱の並び             |

インデックス:

- `(user_id, pinned, sort_order)`
- `(user_id, last_used_at)`

## Out of Scope

- タグ階層（`parent_id`）
- 利用カウント（`last_used_at` で足りる）
- ブックマークの favicon / OG 画像
- `last_used_at` / `pinned` / `color` を更新する API と UI
- 「未整理」専用テーブル（タグ0件のクエリで導出）

## Migration

既存行はデフォルト値で埋める。破壊的変更なし。
