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

`/api/auth/sign-in/email`を処理するcatch-all routeで、Better Auth handlerへ委譲する前にrequest bodyを検査する。guardは以下の順で処理する。

1. pathが`/api/auth/sign-in/email`に完全一致する`POST`だけを対象にする。
2. `Content-Type`が`application/json`（charset付きを許容）以外なら`415`を返す。Better Authのsign-in/emailは`application/x-www-form-urlencoded`も受け付けるが、guardはJSONのみを許可し、form経路で巨大なpasswordがhash/verifyへ到達することを防ぐ。
3. bodyを上限バイト数`SIGN_IN_BODY_MAX_BYTES = 4096`で読み取る。`Content-Length`が上限を超えていれば読み取り前に`413`を返し、`Content-Length`がないstream bodyは上限を超えた時点でcancelする。正常なbodyは上限を超えないため、guard自身のメモリ・CPU消費もboundedになる。
4. 上限内ならJSONをparseし、passwordが文字列で`PASSWORD_MAX_LENGTH`を超えていれば`400`とcode `PASSWORD_TOO_LONG`を返す。codeはBetter Authのsign-upが上限超過で返す語彙と一致させる。

JSONが壊れている場合、passwordが欠落している場合、passwordの型が違う場合はguardで独自処理せず、既存どおりBetter Authへ委譲する。guardはsign-in email endpointにだけ適用し、他の認証endpointの挙動を変えない。

Better Authの`emailAndPassword.maxPasswordLength`にも共有定数を設定する。これはsign-upなどBetter Auth自身が上限検証する処理との整合性を保つためであり、sign-inの事前拒否はroute guardが担う。

パスワード長の境界はJS文字列の`length`（UTF-16 code unit）で判定し、client schema（Valibotの`maxLength`）と同じ基準にする。

### データフロー

```text
POST /api/auth/sign-in/email
  -> path完全一致かつPOSTのみ対象
  -> Content-Typeがapplication/json以外: 415を返す
  -> Content-Lengthが上限超過 / stream読取で上限超過: 413を返す
  -> password.length > 128: 400 (code: PASSWORD_TOO_LONG)を返す
  -> その他: getAuth().handler(request)
  -> Better Authの通常処理
```

リクエストのbodyはcloneからboundedに読むため、正常なリクエストのbodyは消費されず、Better Authは元のrequestを受け取れる。

## テスト

- password schemaは128文字ちょうどを受け入れる。
- password schemaは129文字を拒否する。
- server guardは129文字のrequestでhandlerを呼ばず、400を返す。
- server guardは128文字のrequestをhandlerへ委譲する。
- form-urlencodedや`text/plain`のrequestは415で拒否し、handlerを呼ばない。
- `Content-Length`が上限超過のrequestは413で拒否し、handlerを呼ばない。
- `Content-Length`のないstream bodyが上限を超えたら413で拒否する。
- bodyが上限バイト数ちょうどなら委譲する。
- `application/json; charset=utf-8`は受け付ける。
- malformed JSON、password欠落、password非stringは既存どおり委譲する。
- 委譲後も元のrequest bodyをhandlerが読める。
- 上限境界はUTF-16 code unitで判定される（絵文字2単位相当のケース）。
- 完全一致以外のpath（他endpoint、trailing slash）にはguardを適用しない。
- 既存の認証schemaの下限（8文字）と認証テストは維持する。

server guardはBetter AuthやDBを起動しない単体テストにし、fake handlerの呼び出し有無でhash/verify前の拒否を検証する。

## エラーと互換性

上限超過時は400系のJSON response（400 / 413 / 415）を返す。画面側は既存の汎用サインインエラー表示にフォールバックでき、認証成功・失敗のアカウント列挙防止方針を変更しない。正常なsign-in requestとsign-in以外のauth requestは既存handlerへ委譲する。

## 残余リスク

guardが拒否するrequestはBetter Authの内部rate limiterを経由しないため、guardの拒否path自体のレート制限はこのIssueの範囲外である。body処理は上限バイトでboundedになるため、1 requestあたりの資源消費は抑えられるが、繰り返しの過大入力にはWAF・rate limitなどの別層が必要になる。

## 代替案と採否

- Better Authの設定とclient schemaだけを変更する案は、現行sign-inでhash/verify前に拒否できないため不採用。
- Server Functionへ認証経路を移行する案は防御可能だが、Issueの範囲を超えるため不採用。
