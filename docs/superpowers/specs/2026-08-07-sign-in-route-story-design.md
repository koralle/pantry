# サインイン route 統合と Story 設計

## 目的

サインイン画面の route と画面実装を一つの route ファイルへ統合し、本番の route 構成を Storybook 上で表示できるようにする。
ログイン画面の初期表示、認証エラー、送信中の3状態を Story として確認可能にする。

## 決定事項

- `src/routes/sign-in/index.tsx` をサインイン画面の composition root とする。
- `src/features/auth/components/sign-in-screen.tsx` のレイアウト、認証処理、redirect 処理を route ファイルへ移す。
- `src/features/auth/components/sign-in-screen.tsx` は削除する。
- `SignInWithEmailAndPasswordForm` は既存の feature component として残す。
- `src/routes/sign-in/index.stories.tsx` から `Route` を参照し、TanStack Router の route Story として描画する。
- Story の redirect は未指定とし、ログイン成功時の既定遷移先は `/` とする。
- Story 内では `authClient.signIn.email` を mock して認証結果を制御する。

## 実装構成

### Route

`src/routes/sign-in/index.tsx` に以下を集約する。

- `redirect` の Valibot search schema
- `Route` の定義
- `RouteComponent`
- サインイン画面のレイアウトとスタイル
- `authClient.signIn.email` を呼び出す submit 処理
- 成功時の `router.navigate({ to: redirect ?? '/' })`
- Better Auth のエラーを `SignInError` に変換する処理

`RouteComponent` は search から `redirect` を取得し、同一ファイル内の画面実装へ渡す。フォームは `SignInWithEmailAndPasswordForm` の `onSignIn` callback を通して認証処理を実行する。

### Story

`src/routes/sign-in/index.stories.tsx` は既存の route Story に合わせ、次の構成にする。

- `preview.meta` を使う
- `parameters.layout` は `fullscreen`
- `parameters.tanstack.router.route` に `Route` を指定する
- redirect の search parameter は設定しない
- `beforeEach` で `authClient.signIn.email` の mock を Story ごとに設定する

## Story の状態

### Default

認証 API が成功する mock を設定する。画面が表示され、メール入力、パスワード入力、サインインボタンが利用可能であることを play function で検証する。

### InvalidCredentials

`INVALID_EMAIL_OR_PASSWORD` を返す mock を設定する。フォームを submit し、次を検証する。

- `role="alert"` に認証エラーが表示される
- メールとパスワードのフィールドエラーが表示される

### Pending

解決しない Promise を返す mock を設定する。フォームを submit し、次を検証する。

- ボタンのラベルが `サインイン中...` になる
- fieldset が disabled になる
- submit ボタンが disabled になる

## エラーと副作用

- 認証エラーの表示文言と `SignInError` への変換は既存実装を維持する。
- Story は実際の認証サービスやデータベースへ接続しない。
- Story の成功時に `/` の実画面を描画することは目的にせず、ログイン画面の表示と認証状態の確認に限定する。

## 検証

実装後に worktree で次を実行する。

- format
- markuplint
- oxlint
- typecheck
- Storybook build

既存の route Story の構成と、Storybook の TanStack Router integration が動作することを確認する。

## 非目標

- redirect の複数パターンを Story 化すること
- 認証処理を callback injection へ再設計すること
- サインアップ画面や認証フロー全体を Story 化すること
