# テスト方針

## 1. 目的

- 自分用ブックマーク管理の主要フローを、TursoとCloudflare Workersへ安全にリリースできる状態にする。
- Server Functionのデータ操作、認証境界、ブラウザ上の利用性を検証する。

## 2. 自動テスト

- タグ正規化: 表記は `trim + NFC`（大小保持）、照合キーは小文字化。空文字拒否、32文字上限、20件上限、重複除去。
- ブックマーク操作: タグIDの所有検証と関連付け、URL重複、編集時のタグ全置換、ソフトデリート。
- 一覧: タイトル/URL/メモの検索、タグAND/OR、新着順/更新順、20件単位のcursorページング。
- 認可: 未認証拒否と、他ユーザーのブックマーク・タグを取得/更新/削除できないこと。
- タイトル取得: URL検証、成功時のtitle抽出、タイムアウト・不正URL・取得失敗時のフォールバック。
- 認証: 自己サインアップが拒否され、事前作成ユーザーがサインインできること。
- Domain / Application: brand schema、共有 Result、Bookmark 集約規則、更新 transaction と業務エラー Result。

TypeSpec/OpenAPI契約テストは実施しない。アプリケーション境界はTanStack Start Server Functionである。

## 2.1 UI ブラウザテスト（Storybook）

UI のブラウザ検証の正本は Storybook の Story と `play` 関数とする。Vitest Browser Mode は追加しない。

- Route Story（例: ブックマーク編集）は `Route` を起点に、Ideal / Blank / Loading / Error を網羅する。
- Component Story は注入された port（fake）で更新 Result とフォームエラーを再現する。
- Server Function / Router / DB は Story 内で mock または fake port に差し替え、本番実装を直接呼ばない。

## 2.2 Persistence Integration（実 libSQL）

DB 固有の semantics（cursor pagination、タグ AND/OR、検索 escape、soft delete、user ownership、transaction 整合性）は、Testcontainers で起動した libSQL に本番 migration を適用して検証する。

- 実行: `pnpm run test:persistence`（Docker が必要）
- 通常の `pnpm test` からは分離しており、Docker を起動しない
- 外部 Turso には接続しない
- Pull Request CI の `persistence-integration` job で実行する

## 3. Playwright MCP検証

ローカルとデプロイ済みWorkerに対し、Playwright MCPで実ブラウザ検証を実施する。

- サインイン -> 登録 -> 一覧検索 -> AND/OR切替 -> 編集 -> 削除の一連の操作。
- タイトル取得の失敗後も、手入力タイトルで保存できること。
- 認証・登録・更新・削除のエラーが利用者に分かる形で表示されること。
- デスクトップ幅とモバイル幅で主要操作が完結すること。
- アクセシビリティツリーで、見出し、フォームラベル、ボタン名、エラー通知を確認すること。
- キーボードだけでフォーム送信、削除確認を完了でき、フォーカスが見失われないこと。

## 4. リリース判定

1. Tursoへのマイグレーションが適用できる。
2. 初期ユーザー作成CLIが成功する。
3. `pnpm run format:check`、`pnpm run lint`、`pnpm run typecheck`、`pnpm run test`、`pnpm run test:persistence`、`pnpm run build`が成功する。
4. ローカルでPlaywright MCP検証を完了する。
5. Cloudflare Workersへデプロイし、本番URLでもPlaywright MCPの主要フローを再確認する。
