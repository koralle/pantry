# Turso RPC MVP Design

## Goal

Cloudflare Workers上で動作する自分専用ブックマークマネージャを、日常利用できる最小機能まで完成させる。利用者は事前作成した1アカウントでサインインし、URLを保存、タグ付け、検索、編集、削除できる。

## Architecture

- TanStack StartのUIとServer Functionをアプリケーション境界にする。
- TypeSpec、OpenAPI、独立したHTTP APIは廃止する。
- Cloudflare Workersを実行環境、Turso Cloudを唯一のDBとする。
- Drizzle ORMと`@libsql/client`でTursoに接続する。
- Workersの環境設定は`TURSO_DATABASE_URL`、`TURSO_AUTH_TOKEN`、`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`を使う。
- DBスキーマ変更はDrizzleマイグレーションとしてTursoへ適用する。D1 bindingとD1マイグレーションは使わない。

## Authentication

- Better Authのメールアドレス・パスワードによるサインインだけを提供する。
- サインアップ画面と自己登録エンドポイントを削除/無効化する。
- 初期ユーザーはBetter AuthのサーバーAPIを使うCLIで作成する。パスワードを直接SQLへ書き込まない。
- 保護ルートとすべてのServer Functionでセッションを確認し、DBアクセスを`user_id`で制限する。

## Bookmark Flow

1. 一覧でキーワード、タグ、AND/OR、新着順/更新順を選択し、50件ずつブックマークを表示する。
2. 登録フォームでURLを入力し、必要に応じてタイトルを取得する。失敗時はタイトルを手入力して保存できる。
3. 登録/編集ではメモとタグを入力する。タグは候補から選ぶか新規作成できる。
4. 詳細で内容を確認し、編集または確認付きソフトデリートを実行する。

## Data Rules

- ブックマークはUUID v7、タグは既存の整数IDを維持する。
- タグ名は`trim + 小文字化`し、空文字、33文字以上、21件以上を拒否する。タグ変更は全置換する。
- 一覧は削除済みを除き、`title`、`url`、`note`を部分一致検索する。
- 複数タグはAND/ORで絞り込む。日時はUTCで保存し、日本時間で表示する。
- タイトル取得は`http`/`https`だけを受け付け、危険な宛先を拒否する。3秒、3リダイレクト、1MBを上限とする。

## Verification

- Vitestでタグ、ブックマーク、検索、認可、タイトル取得、自己登録拒否を検証する。
- Playwright MCPでローカルとデプロイ環境のサインインから削除までの主要フローを検証する。
- Playwright MCPでモバイル/デスクトップの操作性、アクセシビリティツリー、キーボード操作、ラベル、フォーカス、エラー通知を確認する。
- リリース前にマイグレーション、初期ユーザー作成、静的検証、テスト、ビルド、デプロイ後のブラウザ検証を完了する。

## Documentation Migration

- `AGENTS.md`、`docs/architecture.md`、`docs/testing.md`をこの設計に更新する。
- 過去のD1/TypeSpec前提の設計・計画は、履歴として残し、この設計への移行済みであることを明記する。
