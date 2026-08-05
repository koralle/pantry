# BookmarkForm エラー所有権設計

## 目的

`BookmarkForm`におけるFormischのvalidation errorと、`BookmarkEditor`が保持する更新結果のserver errorの二重管理をなくす。

エラーの発生源ごとに所有者を定め、表示だけを`BookmarkForm`へ集約する。入力修正時に古いserver errorが残らないこと、summaryとfieldの表示が同じ状態から派生することを成立条件とする。

## 対象範囲

- `BookmarkForm`のFormisch error同期を廃止する
- `BookmarkEditor`の更新結果エラーを`BookmarkEditorError`として唯一の所有者にする
- field編集時に親のserver errorをclearするcallback契約を追加する
- `BookmarkForm`のfield表示とsummary表示を、別々のerror stateではなく同じ入力から構築する
- BookmarkForm Storybookでserver field errorのclearを検証する

対象外:

- エラーメッセージの多言語化
- すべてのdomain errorを構造化message descriptorへ変更すること
- エラー発生時のfocus移動の全面的な再設計
- `BookmarkWorkbenchForm`とBookmarkFormの統合

## エラー所有権

| エラー                                | 所有者                                  | 表示先                                              |
| ------------------------------------- | --------------------------------------- | --------------------------------------------------- |
| Formisch schema validation            | `BookmarkForm`のFormisch store          | field、summary                                      |
| ブックマーク更新のserver/domain error | `BookmarkEditor`の`BookmarkEditorError` | `BookmarkForm`                                      |
| タイトル取得                          | `useBookmarkTitleFetch`                 | summary                                             |
| エラーsummary                         | `BookmarkFormSummary`                   | 完全一致メッセージの重複除去と表示。stateを持たない |

`BookmarkForm`は`BookmarkFormServerError`を受け取って表示するが、Formisch storeへコピーしない。Formischの`getErrors`が返すものはFormisch自身のvalidation errorだけにする。

## 画面用エラーモデル

Application層の`UpdateBookmarkError`は、現在の判別可能unionを維持する。`BookmarkEditor`はそれを画面用の`BookmarkEditorError`へ変換する。

```ts
type BookmarkFormFieldKey = 'url' | 'title' | 'note'

type BookmarkFormServerError = {
  readonly summary?: string
  readonly fields?: Partial<Record<BookmarkFormFieldKey, string>>
}

type BookmarkEditorError = {
  readonly form?: BookmarkFormServerError
}
```

`BookmarkFormServerError`はBookmarkFormのfieldだけを扱う。Formischのvalidation errorはこのモデルへ変換せず、Formisch storeだけが所有する。

## データフロー

```text
入力変更
  -> Formisch storeのinput変更
  -> Formisch field errorをclear
  -> onClearFieldError(field)
  -> BookmarkEditorのserver errorをclear

送信
  -> Formischがschema validation
  -> 成功時にBookmarkEditorへbrand付き値を渡す
  -> BookmarkEditorが更新Resultを処理
  -> 失敗時にBookmarkEditorError.formを更新
  -> BookmarkFormがBookmarkFormServerErrorを表示

```

`BookmarkForm`には次のcallbackを追加する。

```ts
type BookmarkFormProps = {
  // existing props...
  readonly serverError?: BookmarkFormServerError | null
  readonly onClearFieldError?: (field: BookmarkFormFieldKey) => void
}
```

field入力変更時は、Formischのerror clearと同時に`onClearFieldError`を呼ぶ。`BookmarkEditor`はこのcallbackで`BookmarkEditorError.form.fields[field]`だけを削除する。server errorのstateそのものは`BookmarkEditor`に残す。

`BookmarkEditor`は`BookmarkEditorError.form`を表示用propとして`BookmarkForm`へ渡す。フォーム入力の変更時は、該当fieldのserver errorだけを削除する。

## 表示ルール

fieldの表示メッセージは次の優先順位で決める。

1. Formischのfield validation error
2. `BookmarkFormServerError.fields[field]`のserver error

この優先順位は、Formischのエラーが現在の入力値に対する結果であり、server errorが直前の送信時点の入力値に対する結果だからである。実装ではfield表示ロジックの直前に、この理由を短いコメントとして残す。`serverError`は入力変更時にclearするため、優先順位は過渡状態やrace conditionに対する最終的な解決ルールでもある。

`BookmarkForm`は次の情報をsummary候補として集め、空文字を除外する。ただし、重複除去は行わない。

- Formischのvalidation error
- `BookmarkFormServerError.summary`
- `BookmarkFormServerError.fields`のserver error
- タイトル取得エラー

`BookmarkFormSummary`がsummary候補を受け取り、完全一致するメッセージを重複除去して一覧表示する。意味やfieldが異なるエラーを文字列比較で統合することはしない。summaryはフォーム全体の状態を知らせるために使い、fieldは修正箇所を知らせるために使う。両者のstateを別々に持たないことが重要である。

## BookmarkEditorの責務

`BookmarkEditor`は引き続き`UpdateBookmarkError`を`BookmarkEditorError`へ変換し、更新結果のserver errorを保持する。フォーム向けのエラーは`BookmarkEditorError.form`へ入れる。

`onUpdateBookmark`が成功した後の`onCompleted`失敗は、更新失敗として扱わない。更新処理と完了後navigationのエラー境界を分離し、保存済みデータに対して誤った「保存失敗」メッセージを表示しない。

## 設計判断のコメント

実装では、コードだけを読んだときに別の実装へ変更されやすい判断に、読み手が前提と理由を追える日本語コメントで設計理由を残す。コメントの長さは判断の複雑さに合わせる。コメントは処理の説明ではなく、責務境界と採用理由を説明する。

コメントを書くときは、日本語技術文書の規範を使い、一文ごとの意味、段落の論理、用語の一貫性、読み手が保持する情報量を点検する。短くすること自体を目的にせず、将来の開発者が判断を誤って変更しないために必要な説明を残す。

ただし、コメントで補う前に、命名、型、責務分割、データフローによって判断をコードへ表現できないかを検討する。設計と実装だけで意図が正確に伝わる場合は、コメントを追加しない。

次の判断には、判断理由がコードから明らかでない箇所にコメントを付ける。

- server errorをFormisch storeへコピーせず、`BookmarkEditor`に所有させる理由
- field変更時にFormisch errorとserver errorを別々の所有者へclearする理由
- 現在の入力に対するFormisch errorを過去の送信結果であるserver errorより優先する理由
- summaryの重複除去を`BookmarkFormSummary`に任せ、`BookmarkForm`では候補を集めるだけにする理由
- `onUpdateBookmark`と`onCompleted`のエラー境界を分離する理由

既存の処理を言い換えるだけのコメントや、コードの一行ごとの説明は追加しない。長いコメントを避けるのではなく、論点を一つに絞り、読み手が判断の前提と帰結を追える文章にする。

## テスト

既存のBookmarkForm Storyを維持し、次を追加する。

- server field errorがfieldとsummaryに表示される
- server field errorのあるfieldを編集すると、そのfieldのserver errorが消える
- 別fieldのserver errorは編集しても残る
- Formisch validation errorの表示とclearは従来どおり動作する
- title fetch errorはFormisch errorと混ざらず、成功時に消える

通常のVitestではschemaとapplication error mappingを検証し、Storybookの`play`で表示と入力による状態遷移を検証する。

## 非採用案

### BookmarkFormが全エラーを所有する

server/domain errorの意味をBookmarkFormへ持ち込むことになり、`BookmarkEditor`のオーケストレーション責務と分離方針に反するため採用しない。

### すべてのエラーをFormisch storeへコピーする

現在の二重管理を継続するだけであり、外部propsと内部storeのclearタイミングがずれるため採用しない。

### Formisch、server、title fetchを一つの巨大なerror unionへ統合する

独立したライフサイクルを持つエラーを一つのstate machineへまとめるため、field単位のclearが複雑になる。今回の変更では採用しない。
