# パスワード入力上限の認証境界設計

## 背景

現在のサインインではclient側のschemaに最大長がなく、巨大なパスワードがBetter Authのsign-in処理まで到達する。現行Better Authはsign-in時に`maxPasswordLength`をhash/verify前の検証へ適用しないため、巨大入力でもhash/verifyが実行され、WorkersのCPU・メモリを消費し得る。

## 目的

- client schemaとserverのsign-in APIが同じ明示的な最大長を使う。
- 最大長を超えるパスワードをBetter Auth handlerへ渡す前に拒否する。
- 上限ちょうどと上限超過の境界を自動テストで固定する。

## 非目的

- 認証経路をServer Functionへ置き換えない。
- Better Authのhashアルゴリズムやrate limit設定を変更しない。
- パスワード要件の下限や既存の認証エラー仕様を変更しない。

## 設計

### 共有ポリシー

認証機能内の副作用のない共有モジュールに`PASSWORD_MAX_LENGTH = 128`を定義する。128はBetter Authの`maxPasswordLength`標準値と一致する。client schemaとserver側のrequest guard、Better Auth設定はこの定数を参照し、数値の重複を避ける。

### Client validation

既存の`passwordSchema`へ共有定数による`maxLength`を追加する。これにより通常の画面操作では送信前に129文字以上を拒否する。ただしclient validationは攻撃者が回避できるため、セキュリティ上の最終防御にはしない。

### Server validation

`/api/auth/sign-in/email`を処理するcatch-all routeで、Better Auth handlerへ委譲する前にrequest bodyを検査する。`request.clone()`を使ってJSONを読み取り、passwordが文字列で共有上限を超えている場合は400を返す。それ以外のrequestは元のrequestをそのまま`getAuth().handler(request)`へ渡す。

JSONが壊れている場合、passwordが欠落している場合、passwordの型が違う場合はguardで独自処理せず、既存どおりBetter Authへ委譲する。guardはsign-in email endpointにだけ適用し、他の認証endpointの挙動を変えない。

Better Authの`emailAndPassword.maxPasswordLength`にも共有定数を設定する。これはsign-upなどBetter Auth自身が上限検証する処理との整合性を保つためであり、sign-inの事前拒否はroute guardが担う。

### データフロー

```text
POST /api/auth/sign-in/email
  -> request cloneのJSONを検査
  -> password.length > 128: 400を返す
  -> その他: getAuth().handler(request)
  -> Better Authの通常処理
```

リクエストのbodyをcloneから読むため、正常なリクエストのbodyは消費されず、Better Authは元のrequestを受け取れる。

## テスト

- password schemaは128文字ちょうどを受け入れる。
- password schemaは129文字を拒否する。
- server guardは129文字のrequestでhandlerを呼ばず、400を返す。
- server guardは128文字のrequestをhandlerへ委譲する。
- 既存の認証schemaの下限（8文字）と認証テストは維持する。

server guardはBetter AuthやDBを起動しない単体テストにし、fake handlerの呼び出し有無でhash/verify前の拒否を検証する。

## エラーと互換性

上限超過時は400系のJSON responseを返す。画面側は既存の汎用サインインエラー表示にフォールバックでき、認証成功・失敗のアカウント列挙防止方針を変更しない。正常なsign-in requestとsign-in以外のauth requestは既存handlerへ委譲する。

## 代替案と採否

- Better Authの設定とclient schemaだけを変更する案は、現行sign-inでhash/verify前に拒否できないため不採用。
- Server Functionへ認証経路を移行する案は防御可能だが、Issueの範囲を超えるため不採用。
