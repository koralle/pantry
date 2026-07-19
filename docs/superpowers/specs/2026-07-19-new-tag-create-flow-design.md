# 新しいタグ作成フロー設計

日付: 2026-07-19
ブランチ: feat/new-tag-create-flow

## 概要

ユーザーが新しいタグを登録するためのユーザーフローを正式なものにする。
現状 `/tags/new` に基本フォームと `addTag` server function は存在するが、以下の課題がある：

- `addTag` に重複チェックがなく、同名タグが複数作成できてしまう（DB の `unique(userId, name)` 制約には違反しないよう小文字正規化済みで比較されるが、アプリ層で事前に弾いていない）
- タグ一覧画面から「その場で追加」する導線・UI がない
- ブックマーク新規/編集画面にタグ選択 UI がなく、タグのインライン作成・紐付けができない

本設計は以下を実現する：

1. サーバー層で `addTag` の重複を明示的に弾く（専用エラー）
2. タグ一覧画面に常設インライン入力でその場追加
3. ブックマーク新規/編集画面にタグ選択＋インライン作成 UI を追加し、中間テーブルへ紐付け保存する

## 現状の関連コード

- `src/features/tags/tag.function.ts:41` — `addTag`（重複チェックなし）
- `src/features/tags/tag.function.ts:82` — `updateTag`（重複チェックあり、`ne(tagsTable.id, id)` で自身を除外）
- `src/features/tags/tag-name.schema.ts` — `tagNameSchema`：`trim → toLowerCase → nonEmpty → maxLength(32)`
- `src/routes/_protected/tags/new.tsx` — 別画面の新規作成フォーム
- `src/routes/_protected/tags/index.tsx` — 一覧画面（要確認・編集）
- `src/routes/_protected/bookmarks/new/index.tsx` — ブックマーク新規（URL/title のみ、タグなし）
- `src/routes/_protected/bookmarks/$id/edit.tsx` — ブックマーク編集（タグなし）
- `src/db/schema/tag.ts:26` — `unique().on(t.userId, t.name)` 制約あり
- `src/db/schema/bookmark-tag.ts` — `bookmarkTagsTable`（中間テーブル、`bookmarkId`, `tagId`）

## 設計

### 1. サーバー層: `addTag` 重複ガード

`src/features/tags/tag.function.ts` の `addTag` handler に、insert 前の重複チェックを追加する。
`updateTag` と同じ `tagsTable` クエリパターンを使用し、自身IDの除外（`ne`）は不要。

新規に専用エラークラス `TagNameAlreadyExistsError` を `tag.function.ts` に定義し、
重複検出時に投げる。これによりクライアント側で `instanceof` で判定しやすくなる。

```ts
export class TagNameAlreadyExistsError extends Error {
  constructor() {
    super('タグ名が既に存在します')
    this.name = 'TagNameAlreadyExistsError'
  }
}
```

`addTag` handler の挿入前：

```ts
const [duplicate] = await db
  .select({ id: tagsTable.id })
  .from(tagsTable)
  .where(and(eq(tagsTable.name, name), eq(tagsTable.userId, session.user.id)))
  .limit(1)

if (duplicate != null) {
  throw new TagNameAlreadyExistsError()
}
```

`name` は `tagNameSchema` により小文字正規化済みなので、比較は正規化済み同士で一致する。

### 2. タグ一覧画面: 常設インライン入力

新規コンポーネント `src/features/tags/components/inline-add-tag.tsx` を作成し、
`src/routes/_protected/tags/index.tsx` の一覧エリアに配置する。

挙動：
- テキスト入力（常設）＋「追加」ボタン（または Enter で送信）
- クライアント側で `tagNameSchema` で検証（空・32文字超は入力段階で弾く）
- `addTag` を呼び、成功時は `router.invalidate()`（または該当クエリの再取得）で一覧を即反映し、入力欄をクリア
- `TagNameAlreadyExistsError` を catch した場合は入力欄直下に「そのタグ名は既に存在します」と表示
- 作成中はボタンを disabled（`isPending`）

UI ライブラリは既存と同じ `@base-ui/react` の `Input` を使用する。

### 3. ブックマーク画面: タグ選択＋インライン作成＋紐付け保存

#### 3a. タグ選択コンポーネント

新規コンポーネント（配置場所は `src/features/bookmarks/components/tag-selector.tsx` または `src/features/tags/components/`）：

- 既存タグ一覧をチップ/マルチセレクトで表示し、選択状態（tagId の Set/配列）を保持
- 入力欄で既存タグを絞り込みつつ、入力した名前で「その場で作成」可能
- 作成時は `addTag` を呼び：
  - 成功 → 作成したタグを選択状態に追加
  - `TagNameAlreadyExistsError` → 「既に存在します」と表示しつつ、既存タグを検索して選択状態に追加（再利用）
- 選択状態は親（ブックマークフォーム）へ tagId 配列として渡す

#### 3b. ブックマーク server function の拡張

`addBookmark`（`bookmark.function.ts:33`）と `updateBookmark`（`:66`）の入力スキーマに
`tags: v.array(v.number())` を追加する。

- `addBookmark`: insert 後に `bookmarkTagsTable` へ `{ bookmarkId, tagId }` を一括 insert
- `updateBookmark`: 既存の紐付けを `delete`（bookmarkId 一致）した上で、新しい tagId 配列を一括 insert（置換セマンティクス）

両者とも `ensureSession` で `userId` を取得済み。tagId が自ユーザー所有かの検証は、
MVP スコープでは既存タグ選択 UI からのみ渡される前提とし、厳密な所有権検証は将来課題とする（YAGNI）。

#### 3c. ブックマークフォームへの組み込み

- `src/routes/_protected/bookmarks/new/index.tsx` と
  `src/routes/_protected/bookmarks/$id/edit.tsx` に `tag-selector` を組み込み、
  submit 時に選択 tagId 配列を `addBookmark` / `updateBookmark` へ渡す。

### 4. テスト戦略

既存テスト（`tag-name.schema.test.ts`, `bookmark.function.test.ts`）のパターンに倣う。

- 新規 `src/features/tags/tag.function.test.ts`:
  - `addTag` で同名タグを作成しようとすると `TagNameAlreadyExistsError` が投げられる
  - 異なる名前なら作成でき、id が返る
- `src/features/bookmarks/bookmark.function.test.ts` 拡張:
  - `addBookmark` に tagId 配列を渡すと `bookmarkTagsTable` に紐付け行ができる
  - `updateBookmark` でタグ配列を変更すると紐付けが置換される
- `tag-name.schema.test.ts` は変更なし（正規化ロジックは変更しない）
- 手動確認: 一覧画面インライン入力で作成→即反映、重複時エラー表示

## スコープ外（YAGNI）

- タグの階層/ネスト
- タグの一括インポート
- 厳密な tagId 所有権検証（中間テーブル insert 前の自ユーザー確認）
- タグの色・説明などのメタデータ

## 実装順序（案）

1. `addTag` 重複ガード ＋ `TagNameAlreadyExistsError`
2. `addBookmark` / `updateBookmark` のタグ紐付け拡張
3. 一覧画面インライン入力コンポーネント
4. ブックマーク用タグ選択コンポーネント ＋ フォーム組み込み
5. テスト追加・拡張
