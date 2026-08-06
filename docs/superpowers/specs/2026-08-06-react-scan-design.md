# React Scan ローカル開発導入

## Goal

ローカル開発時のみ React Scan を自動有効化し、アプリ本体の計測対象コードを変更せず、React Scan の統合箇所だけを追加変更する。本番 HTML および本番ランタイムには React Scan を含めない。

## Design

### 依存関係

- `react-scan` を `devDependencies` に追加する（`pnpm add -D react-scan`）。
- 本番依存（`dependencies`）には追加しない。

### 挿入箇所

- 変更ファイルは `src/features/app-shell/components/root-document.tsx` のみ（依存追加に伴う `package.json` / lockfile を除く）。
- `<head>` 内へ、公式の `auto.global.js` を読み込む `<script>` を出力する。
- 公式スクリプトタグに従い、属性は次のとおりとする。
  - `src`: `//unpkg.com/react-scan/dist/auto.global.js`
  - `crossOrigin`: `"anonymous"`
- スクリプトは `<head>` 内の他スクリプトより前に置く。現行の `RootDocument` では `<HeadContent />` より前に置く。

### 有効化条件

- `import.meta.env.DEV` が真のときだけ `<script>` を出力する。
- 偽のとき（本番ビルド・プレビュー等）は当該 `<script>` を一切出力しない。
- React Scan 用の専用環境変数や feature flag は導入しない。ゲートは `import.meta.env.DEV` のみとする。

### 構成イメージ

```tsx
<head>
  <meta charSet='UTF-8' />
  <title>Pantry</title>
  {import.meta.env.DEV ? (
    <script
      crossOrigin='anonymous'
      src='//unpkg.com/react-scan/dist/auto.global.js'
    />
  ) : null}
  <HeadContent />
</head>
```

## Behavior / Failure Handling

### 正常時（ローカル開発）

1. `pnpm run dev` で開発サーバーを起動する。
2. `import.meta.env.DEV === true` のため `RootDocument` の `<head>` に公式 `auto.global.js` の `<script>` が出力される。
3. ブラウザがスクリプトを読み込み、React Scan が自動初期化する。
4. 画面上に React Scan のツールバーが表示される。

### 本番・非開発ビルド

1. `pnpm run build` およびその成果物の実行では `import.meta.env.DEV === false` である。
2. 当該 `<script>` は HTML に出力されない。
3. 本番ランタイムに React Scan のコードパスを含めない（CDN 読み込みも行わない）。

### 外部スクリプト失敗時

- CDN 到達不能・スクリプト読み込みエラー・初期化失敗が発生しても、アプリ独自のエラー表示・トースト・リトライ・フォールバック UI は追加しない。
- ブラウザの標準的なスクリプト失敗挙動に任せ、アプリ本体の動作はそのまま継続する。
- `onerror` ハンドラや代替スクリプト経路は実装しない。

## Verification

テストコードは追加しない。次の手動・コマンド検証のみ行う。

| 検証項目       | 方法                                          | 期待結果                            |
| -------------- | --------------------------------------------- | ----------------------------------- |
| 開発時の有効化 | `pnpm run dev` でアプリを開き、画面を確認する | React Scan のツールバーが表示される |
| 本番ビルド     | `pnpm run build`                              | ビルドが成功する（exit code 0）     |

ビルド成果物の HTML に `auto.global.js` が含まれないことは、上記の `import.meta.env.DEV` ゲートにより保証する。必要ならビルド成果を目視確認してよいが、必須の自動化テストは設けない。

## Out of Scope

- 本番環境での React Scan 有効化
- `react-scan` の module import（`import { scan } from 'react-scan'`）や Vite プラグイン導入
- アプリ独自のエラー表示・フォールバック・リトライ
- 新規テスト（ユニット / 結合 / e2e）の追加
- React Scan の設定 UI・オプション（有効化条件以外のカスタム設定）の追加
- TanStack Devtools など既存開発ツールの変更
- `.cursor/` や `.env.production` など本設計と無関係なファイルの変更
