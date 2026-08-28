# Pantry

自分専用の、タグで整理するブックマークマネージャ。

## Language

**Tag**:
ブックマークに付ける、ユーザー所有のラベル。同一性は TagId であり、名前ではない。
_Avoid_: Label, category

**TagId**:
Tag の同一性。
_Avoid_: 名前で Tag を指すこと

**TagName**:
Tag の名前。`display` と `normalized` の組であり、小文字化した文字列そのものではない。
_Avoid_: TagLabel, TagHandle, 小文字文字列としての TagName

**display**（表記名）:
TagName のうち、ユーザーが見て編集する書き形。名前の正本。
_Avoid_: 組全体を name と呼ぶこと, label

**normalized**（正規化名）:
TagName のうち、`display` から常に導出される形。二つの書き形が同じ名前かどうかの判定に使う。単独では存在しない。
_Avoid_: slug, hash, 独立して与えるキー

**Passkey**（パスキー）:
ログイン済みユーザーが端末やパスキーマネージャーに保持する、WebAuthn の発見可能な資格情報。Pantry は公開鍵だけを保持する。同一性は認証器が発行する credential ID であり、表示名ではない。
_Avoid_: パスワードの別名として Passkey を使うこと, 秘密鍵

**Passkey display name**（パスキーの表示名）:
設定画面でパスキーを区別するためのラベル。ユーザーが付けた名前があればそれを使い、なければ認証器名、それも判別できなければ `パスキー`。
_Avoid_: 認証器名をユーザー設定名として保存すること
