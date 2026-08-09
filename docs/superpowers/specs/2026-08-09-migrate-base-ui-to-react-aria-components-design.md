# Base UIからReact Aria Componentsへの移行設計

## 目的

PantryのUIコンポーネントライブラリを`@base-ui/react`から`react-aria-components`へ移行する。

移行後も既存の画面構成、Panda CSSの見た目、Formischのフォーム状態管理、Storybookの検証方針を維持する。

`@base-ui/react`の参照と依存関係をリポジトリからなくし、React Aria Componentsが提供するpress semantics、focus管理、modalのアクセシビリティ挙動を利用する。

## 現状

Base UIの利用箇所は次の範囲に限られる。

- 共有の`StyledButton`
- 共有の`StyledInput`
- モバイル棚シートのDialog
- ブックマーク削除確認のDialog
- ブックマークフォーム、タグフォーム、タグのクイック追加フォームにあるInput

フォームのvalidation、server error、タイトル取得、送信処理はBase UIの責務ではないため、移行対象に含めない。

## 決定事項

### 依存関係

`react-aria-components`をアプリケーション依存関係へ追加する。

`@base-ui/react`を`package.json`、`pnpm-workspace.yaml`、lockfileから削除する。

ソース、Storybook、テスト、ドキュメントに残るBase UIのimportと名称も削除する。

### 共有Button

`src/shared/components/styled-button/index.tsx`の`StyledButton`は、React Aria Componentsの`Button`を基盤にする。

既存の`visual`と`size`のPanda recipeは維持する。

React Aria Componentsの状態属性を既存のrecipeへ接続し、次の挙動を保つ。

- `type`の既定値は`button`
- `visual`と`size`による外観
- `isDisabled`時の操作抑止とdisabled表示
- フォーム内のsubmit、cancel、danger操作
- `className`とPanda style propsの受け渡し

既存の呼び出し側がDOM属性の`disabled`を使っている場合は、React Aria ComponentsのAPIに合わせて`isDisabled`へ更新する。

### 共有Input

`src/shared/components/styled-input/index.tsx`の`StyledInput`は、React Aria Componentsの`Input`を基盤にする。

現在のpadding、border、background、width、touch targetのスタイルを維持する。

React Aria ComponentsのInputが提供する標準の`onChange`、`value`、`ref`、HTML input属性を利用する。

### フォームInput

Base UIの`Input`を直接importしているフォームをReact Aria Componentsまたは共有の`StyledInput`へ置き換える。

`onValueChange`は使わず、`onChange`で受け取った文字列をFormischの`fieldProps.onChange`または既存のstate setterへ渡す。

次の契約は変更しない。

- `id`と`label`の関連付け
- `name`とFormischのfield ref
- `required`、`autocomplete`
- `aria-invalid`、`aria-describedby`
- フィールドエラーとserver errorの優先順位
- URL入力からのタイトル取得

### Dialog

Base UIのDialogを、React Aria Componentsの次の構成へ置き換える。

```tsx
<DialogTrigger>
  <Button>...</Button>
  <ModalOverlay>
    <Modal>
      <Dialog>
        <Heading slot='title'>...</Heading>
        ...
      </Dialog>
    </Modal>
  </ModalOverlay>
</DialogTrigger>
```

モバイル棚シートと削除確認Dialogは、それぞれ既存のPanda CSSを使い続ける。

React Aria Componentsへ次の挙動を委譲する。

- Escapeによる閉じる操作
- 外側クリックによる閉じる操作
- 開いたときの初期フォーカス
- 背景コンテンツの操作抑止
- 閉じた後のtriggerへのフォーカス復帰

削除処理中の`deleteError`、`isDeleting`、navigation、モバイル棚の`onNavigate`は既存の状態管理を維持する。

### SSR

TanStack StartのSSRを維持する。

overlayはReact Aria Componentsの`ModalOverlay`と`Modal`を使い、windowやdocumentを参照する独自のclient-only処理は追加しない。

## データフローとエラー

ライブラリ移行によって、フォームのデータフローは変更しない。

入力イベントは次の経路を通る。

```text
React Aria Input
  -> onChange
  -> Formisch fieldProps.onChange または state setter
  -> 既存のvalidation / submit / server error処理
```

Buttonのpress処理はReact Aria Componentsへ移行するが、既存の非同期処理とエラー所有権は各feature componentに残す。

削除確認のエラーはDialog内の`role="alert"`として表示し、棚シートのnavigation後にDialogが閉じる契約も維持する。

## 検証

### 静的検証

- `@base-ui/react`のソース参照がゼロである
- `pnpm run format:check`
- `pnpm run lint`
- `pnpm run lint:markup`
- `pnpm run typecheck`

### 自動検証

- `pnpm run test`
- `pnpm run build`
- Storybook build

### UI検証

- Buttonのdefault、accent、danger、size、disabled表示
- フォームの入力、validation error、server error、タイトル取得、送信
- 削除Dialogの開閉、Escape、外側クリック、キャンセル、削除失敗、フォーカス復帰
- モバイル棚シートの開閉、Escape、棚選択後の閉じる処理
- デスクトップ幅とモバイル幅
- キーボード操作とアクセシビリティツリー上のlabel、dialog title、error announcement

## 完了条件

次の条件をすべて満たしたとき、移行完了とする。

1. `@base-ui/react`が依存関係、ソース、テスト、Storybook、ドキュメントから削除されている。
2. `react-aria-components`を使ったButton、Input、Dialogが既存の画面で動作する。
3. 既存の視覚スタイルとフォームのデータフローが維持されている。
4. 静的検証、自動検証、Storybook buildが成功する。
5. キーボード操作、focus管理、error announcementを確認できる。

## 作業分離

既存の`migrate-react-aria` worktreeと`aria-core`エージェントには触れない。

実装はHerdrで新規worktreeを作成し、そのworktree上でCursorエージェントを起動して行う。

実装完了後は、Cursorエージェントの差分を確認してから検証を実行する。
