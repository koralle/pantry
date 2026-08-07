# Storybook Device Viewports セットアップ設計

## 目的

Storybook の viewport selector から、Apple iPhone、Apple iPad、Google Pixel の各端末サイズを選択できるようにする。
全 Story に同じ viewport 定義を適用し、既存の Story ごとの viewport override も妨げない。

## 決定事項

- `storybook-device-viewports` の最新安定版 `0.1.2` を dev dependency として追加する。
- パッケージが提供する `AWESOME_DEVICE_VIEWPORTS` を利用する。
- viewport 定義は `src/storybook/preview.tsx` の global parameters に設定する。
- `src/storybook/main.ts` の addon 構成は変更しない。
- 既存の Story ファイルとアプリケーションコードは変更しない。

## 実装構成

### Dependency

`package.json` の devDependencies に `storybook-device-viewports` を追加し、`pnpm-lock.yaml` を更新する。
パッケージの Storybook peer 要件は `^10.1.11` であり、プロジェクトの Storybook `10.5.5` と互換性がある。

### Preview configuration

`src/storybook/preview.tsx` で `AWESOME_DEVICE_VIEWPORTS` を import し、既存の parameters に次を追加する。
Storybook 10 では viewport 定義の parameter key に `options` を使う。

```ts
viewport: {
  options: AWESOME_DEVICE_VIEWPORTS
}
```

これにより、全 Story が端末 viewport を共有する。Story 単位で `parameters.viewport` を指定した場合は、Storybook の通常の override 規則に従う。

## 検証

次を worktree で実行する。

- `mise exec -- pnpm run format:check`
- `mise exec -- pnpm run typecheck`
- `mise exec -- pnpm run lint`
- `mise exec -- pnpm run build-storybook`

Storybook build が成功し、追加した package import と preview parameter が型チェックを通ることを確認する。

## 非目標

- 端末ごとの Story を新規作成すること
- viewport の独自サイズ map を保守すること
- Storybook addon の追加・置換を行うこと
- アプリケーション本体の responsive CSS を変更すること
