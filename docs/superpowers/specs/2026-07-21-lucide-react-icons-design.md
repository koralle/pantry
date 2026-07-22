# Lucide React アイコン一括導入

Issue: [#101 アイコンとしてLucide (lucide-react) を導入する](https://github.com/koralle/pantry/issues/101)

## Goal

アイコンが一切ないテキストのみの UI に、lucide-react を一括導入する。既存テキストはすべて残したままアイコンを併記し、無機質な印象を和らげて愛着の湧く画面にする。既存の Unicode 記号（`＋` `×` `−`）は対応する Lucide アイコンに置き換える。

## Constraints and Decisions

| 項目             | 決定                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 導入方法         | `lucide-react` のコンポーネントを各ファイルで直接 import。ラッパーコンポーネントは作らない                                                      |
| 導入範囲         | 全画面に一括（1 PR）                                                                                                                            |
| テキストとの関係 | テキスト併記。アイコンは装飾として `aria-hidden`                                                                                                |
| サイズ           | 基本 `size={16}`。見出し・空状態など強調箇所は `size={20}`                                                                                      |
| Unicode 記号     | `＋` `×` `−` を Lucide アイコンに置換。`—`（空セル）はテキストのまま                                                                            |
| CSS              | レイアウト用は追加不要（ボタン・リンクは既に `inline-flex; align-items: center`）。`UiLoading` のローダー spin 用 keyframe を app.css に1つ追加 |
| 依存             | `lucide-react` は package.json に存在済み。追加インストール不要                                                                                 |

## Icon Mapping

### 共通コンポーネント

| ファイル                            | 箇所                 | アイコン                                    |
| ----------------------------------- | -------------------- | ------------------------------------------- |
| `src/components/ui-state.tsx`       | UiLoading            | `LoaderCircle`（+ CSS spin アニメーション） |
| 同上                                | UiEmpty              | `PackageOpen`                               |
| 同上                                | UiError メッセージ   | `TriangleAlert`                             |
| 同上                                | UiError 再試行ボタン | `RefreshCw`                                 |
| `src/components/error-fallback.tsx` | ErrorFallback        | `TriangleAlert`                             |

### アプリシェル

| ファイル                    | 箇所                     | アイコン   |
| --------------------------- | ------------------------ | ---------- |
| `src/routes/_protected.tsx` | 「＋新規」リンク         | `Plus`     |
| 同上                        | 「設定」リンク           | `Settings` |
| 同上                        | 「ログアウト」ボタン     | `LogOut`   |
| 同上                        | 「棚を変える」(モバイル) | `Menu`     |
| 同上                        | シート「閉じる」         | `X`        |
| 同上                        | 「タグ管理」リンク       | `Tags`     |

### ブックマーク一覧

| ファイル                                               | 箇所                              | アイコン              |
| ------------------------------------------------------ | --------------------------------- | --------------------- |
| `src/features/bookmarks/components/bookmark-list.tsx`  | 「新規」リンク                    | `Plus`                |
| 同上                                                   | 検索ボタン                        | `Search`              |
| 同上                                                   | レイアウト切替（テーブル/カード） | `List` / `LayoutGrid` |
| 同上                                                   | タグチップ削除 `×`                | `X`                   |
| 同上                                                   | 「さらに読み込む」                | `ChevronDown`         |
| `src/features/bookmarks/components/bookmark-table.tsx` | URL カラム（詳細への内部リンク）  | `Globe`               |

### 玄関（ホーム）

| ファイル                                          | 箇所             | アイコン  |
| ------------------------------------------------- | ---------------- | --------- |
| `src/features/tags/components/entrance-boxes.tsx` | 各ボックス       | `Package` |
| 同上                                              | 空状態アクション | `Plus`    |

### タグ管理

| ファイル                                           | 箇所                        | アイコン         |
| -------------------------------------------------- | --------------------------- | ---------------- |
| `src/routes/_protected/tags/index.tsx`             | 「新規タグ」リンク          | `Plus`           |
| `src/features/tags/tag-table.tsx`                  | ピン列                      | `Pin`            |
| 同上                                               | 「編集」リンク              | `Pencil`         |
| `src/features/tags/components/tag-edit-fields.tsx` | ピントグル                  | `Pin` / `PinOff` |
| 同上                                               | ソート順ステッパー `−`/`＋` | `Minus` / `Plus` |
| 同上                                               | カラー選択中スウォッチ      | `Check`          |
| `src/features/tags/components/inline-add-tag.tsx`  | 「追加」ボタン              | `Plus`           |

### ブックマーク詳細・編集

| ファイル                                             | 箇所                         | アイコン       |
| ---------------------------------------------------- | ---------------------------- | -------------- |
| `src/routes/_protected/bookmarks/$id/index.tsx`      | 「一覧へ戻る」               | `ArrowLeft`    |
| 同上                                                 | フラッシュメッセージ         | `CircleCheck`  |
| 同上                                                 | 外部 URL リンク              | `ExternalLink` |
| 同上                                                 | 「編集」                     | `Pencil`       |
| 同上                                                 | 「削除」トリガー・確認ボタン | `Trash2`       |
| 同上                                                 | ダイアログ「キャンセル」     | `X`            |
| `src/routes/_protected/bookmarks/$id.edit.tsx`       | 戻るリンク群                 | `ArrowLeft`    |
| `src/routes/_protected/bookmarks/new/index.tsx`      | 戻るリンク                   | `ArrowLeft`    |
| `src/features/bookmarks/components/tag-selector.tsx` | 「この名前で作成」           | `Plus`         |
| 同上                                                 | フィルタ入力                 | `Search`       |

### ワークベンチフォーム

| ファイル                                                                  | 箇所                   | アイコン      |
| ------------------------------------------------------------------------- | ---------------------- | ------------- |
| `src/routes/_protected/bookmarks/-components/bookmark-workbench-form.tsx` | フォームエラーサマリー | `CircleAlert` |
| 同上                                                                      | 「タイトルを取得」     | `Download`    |
| `src/routes/_protected/tags/new.tsx`                                      | 戻るリンク             | `ArrowLeft`   |
| `src/routes/_protected/tags/$id.edit.tsx`                                 | 戻るリンク             | `ArrowLeft`   |
| 同上                                                                      | フォームエラーサマリー | `CircleAlert` |

### 認証

| ファイル                                                                  | 箇所                   | アイコン      |
| ------------------------------------------------------------------------- | ---------------------- | ------------- |
| `src/routes/sign-in/index.tsx`                                            | ブランド領域           | `Package`     |
| `src/routes/sign-in/-components/sign-in-with-email-and-password-form.tsx` | メールフィールド       | `Mail`        |
| 同上                                                                      | パスワードフィールド   | `Lock`        |
| 同上                                                                      | サインイン送信         | `LogIn`       |
| 同上                                                                      | フォームエラーサマリー | `CircleAlert` |

### 設定

| ファイル                                   | 箇所           | アイコン    |
| ------------------------------------------ | -------------- | ----------- |
| `src/routes/_protected/settings/index.tsx` | 「ログアウト」 | `LogOut`    |
| 同上                                       | 「玄関へ戻る」 | `ArrowLeft` |

### 対象外

- `src/routes/sign-up.tsx` — プレースホルダのみで UI なし
- `src/routeTree.gen.ts` — 生成ファイル
- API ルート — UI なし

## Accessibility

- 全アイコンに `aria-hidden` を付与し、装飾として扱う
- 既存テキストはすべて残すため、スクリーンリーダーへの情報伝達は変化しない
- `UiLoading` の spin アニメーションは `prefers-reduced-motion` を尊重する（app.css の既存パターンに準拠）

## Testing

- 既存の Vitest スイート（`pnpm run test`）が全件通ること
- `pnpm run lint` / `pnpm run typecheck` が通ること
- 手動確認: dev サーバーで全画面のアイコン表示を目視
