# React Aria Components 移行ノート（Base UI → react-aria-components）

このノートは Base UI (`@base-ui/react`) から React Aria Components
(`react-aria-components@1.20.0`) への移行で得た勘所をまとめたものです。
Button / Input / Dialog を移行するエージェントは先にこれを読んでください。

- 対象バージョン: `react-aria-components@1.20.0`（`react-aria@3.51.0` が依存に入る）
- catalog: `pnpm-workspace.yaml` の `catalogs.ui` に `react-aria-components: 1.20.0`
- 依存: `package.json` の dependencies に `"react-aria-components": "catalog:ui"`
- インポートは**サブパス**推奨（ツリーシェイキングのため）:
  - `react-aria-components/Button`
  - `react-aria-components/Input`
  - `react-aria-components/Dialog`（`Dialog`, `DialogTrigger`）
  - `react-aria-components/Modal`（`Modal`, `ModalOverlay`）
  - `react-aria-components/Heading`
  - `react-aria-components/Text`

---

## 0. 全体共通の注意点

### `exactOptionalPropertyTypes` が有効

`tsconfig` が `exactOptionalPropertyTypes: true`。RAC の props は
`undefined` を許容しない任意プロパティが多いため、`undefined` になり得る値を
そのまま `onClick={maybeUndef}` のように渡すと型エラーになる。
回避策: `?? false` / `?? 既定値` で確定値にするか、条件付きで spread する。
（`StyledButton` では `isDisabled={disabled ?? false}` にしている。）

### Panda の `styled()` は RAC コンポーネントをそのまま包める

`styled(AriaButton, recipe)` は動作する。Panda の styled factory は
variant キー（`visual`, `size`）と CSS プロパティ以外をそのまま本体へ転送し、
`ref` も転送する（RAC 側は `forwardRef` 済み）。`className` は文字列で渡れば
問題ない（RAC は関数も受け取るが、styled が計算した文字列をそのまま使える）。

### SSR（Cloudflare Workers）での挙動

- RAC の各モジュールは `client-only` を import するが、これは
  `react-server` export 条件でのみ throw する。本プロジェクト（TanStack Start +
  Vite + workerd）は `react-server` 条件を使わないため SSR でも import できる。
- `Modal` / `ModalOverlay` は SSR 中は `null` を返す（`useIsSSR`）。クライアント
  でハイドレート後に描画される。したがって SSR レンダリング結果にダイアログ本体が
  出なくても正常。
- `Button` / `Input` は SSR でもそのまま `<button>` / `<input>` として描画される。

---

## 1. Button（`styled-button/index.tsx`）

### Base UI との API 差

| Base UI    | React Aria                   | 備考                                                                       |
| ---------- | ---------------------------- | -------------------------------------------------------------------------- |
| `disabled` | `isDisabled`                 | RAC はネイティブ `disabled` 属性を `isDisabled` から生成する               |
| `onClick`  | `onPress`（推奨）/ `onClick` | RAC の `onClick` は `onPress` の別名として**型・実行時ともサポート**される |
| `type`     | `type`                       | デフォルトは同じく `'button'`                                              |

### やったこと

`StyledButton` は既存呼び出し側（`disabled` / `onClick` / `type` / `visual` /
`size` を使う多数のファイル）を壊さないよう、**公開 API を維持**した:

- 型に `disabled?: boolean` を追加し、本体で `isDisabled={disabled ?? false}` に変換。
- `onClick` は RAC 側が元々型付けしているので**追加の型宣言は不要**。
  （自分で `onClick?: MouseEventHandler` を足すと RAC 側の `onClick` 型と交差して
  `exactOptionalPropertyTypes` でエラーになる。足さないこと。）
- `type = 'button'` を既定のまま転送。

### 動作確認済み

- `disabled` → 実際の DOM に `disabled` 属性が出る（Panda の `_disabled`
  (= `:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])`) と
  CSS `:disabled` が引き続き効く）。
- `type="submit"` はフォーム送信を壊さない。RAC の `usePress` は
  `type="submit"` / `type="reset"` のボタンで `preventDefault` しない
  （`shouldPreventDefaultUp` 参照）。`bookmark-list-toolbar.tsx` の
  `<StyledButton type="submit">` がこれに依存している。
- ダイアログのトリガーとして使う場合、`DialogTrigger` 内なら
  `PressResponder` コンテキストを `usePress` が購読して自動的に
  トリガーとして接続される（`aria-expanded` / `aria-controls` が付く）。

---

## 2. Input（`styled-input/index.tsx`）

### Base UI との API 差

| Base UI                                        | React Aria                    | 備考                                        |
| ---------------------------------------------- | ----------------------------- | ------------------------------------------- |
| `onValueChange(value, details)`                | 無し（ネイティブ `onChange`） | Base UI 独自コールバック                    |
| `value` / `defaultValue` / `disabled` / `type` | 同名でそのまま                | RAC `Input` は `InputHTMLAttributes` を継承 |

### やったこと

既存呼び出し側が `onValueChange={(newValue) => ...}` を使っているため、
`StyledInput` で `onValueChange?: (value: string) => void` を受け続け、
ネイティブ `onChange` から `event.currentTarget.value` を渡して互換にした。
呼び出し側の `onChange` も併せて呼ぶ。

```tsx
const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
  onChange?.(event)
  onValueChange?.(event.currentTarget.value)
}
```

### 注意

- RAC の `Input` は単体でも動く（`TextField` 内なら `InputContext` から
  props をもらう）。今回は単体利用。
- `aria-invalid` はネイティブ属性としてそのまま DOM に出る。RAC は
  `aria-invalid` が truthy かつ `'false'` でないときに `data-invalid` を付与する。

---

## 3. Dialog（`mobile-shelf-dialog.tsx`, `bookmark-delete-dialog.tsx`）

### 構造のマッピング

Base UI と RAC では部品構成が異なる。RAC は「トリガー + オーバーレイ」を
`DialogTrigger` で包み、オーバーレイは `ModalOverlay`（背景）> `Modal`
（フォーカス閉じ込め・スクロールロックの箱）> `Dialog`（`role="dialog"` の
意味的コンテナ）の 3 層になる。

| Base UI                         | React Aria                                | 備考                                                                         |
| ------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| `Dialog.Root open onOpenChange` | `DialogTrigger isOpen onOpenChange`       | 制御状態はトリガーに置く                                                     |
| `Dialog.Trigger`                | `Button`（`DialogTrigger` の最初の子）    | 押下可能な RAC コンポーネントである必要がある                                |
| `Dialog.Portal`                 | （不要）                                  | `Modal`/`ModalOverlay` が自動でポータルする                                  |
| `Dialog.Backdrop`               | `ModalOverlay`                            | 背景。`isDismissable` をここに付ける                                         |
| `Dialog.Popup`                  | `Modal` + `Dialog`                        | 配置・見た目は `Dialog` に寄せると flex/gap が子に効く                       |
| `Dialog.Title`                  | `Heading slot="title"`                    | Base UI は `<h2>` を出力するので `level={2}` を明示（RAC の既定 level は 3） |
| `Dialog.Description`            | `Text slot="description" elementType="p"` | Base UI は `<p>` を出力するので `elementType="p"`                            |
| `Dialog.Close`                  | `Button slot="close"`                     | `close()` を自動で呼ぶ（`children` render prop の `close` でも可）           |

### 重要な挙動差・判断

1. **`isDismissable` を必ず付ける。**
   Base UI の `Dialog.Root` は既定で `dismissible`（背景クリック・Escape で閉じる）。
   RAC の `ModalOverlay` は `isDismissable` の既定が `false`（背景クリックで閉じない）。
   従来挙動を守るため `ModalOverlay` に `isDismissable` を渡した。
   （Escape は RAC でも閉じるが、背景クリック dismissal は `isDismissable` が必要。）

2. **見た目・余白は `Dialog`（`section`）に付ける。**
   `dialog` / `shelfSheet` の CSS は `flex` / `gap` / `padding` を子
   （見出し・説明・ボタン群）に直接効かせている。`Modal`（`div`）に付けると
   `Dialog` という単一の子を介すため `gap` が効かなくなる。よって配置・箱・
   内側レイアウトを丸ごと `Dialog` の `className` に渡した。
   `Dialog` は `position: fixed` + `margin: auto` でセンタリング
   （`dialog`）、あるいは下端固定（`shelfSheet`）になる。

3. **トリガーは RAC の `Button`（または `Pressable`）である必要がある。**
   素の `<button>` を `DialogTrigger` の子にすると
   `PressResponder` に登録されず開発時に警告が出る。
   トリガーに `button()` レシピを当てる場合は `className={button({...})}` を
   RAC `Button` に渡す。

4. **`aria-haspopup` は意図的に付かない。**
   RAC の `useOverlayTrigger` はダイアログに `aria-haspopup` を付けない
   （スクリーンリーダーがメニューと誤読するため、menu/listbox のみ付与）。
   トリガーには `aria-expanded` / `aria-controls` が付く。これは Base UI との
   意図的な差であり、修正しないこと。

5. **`slot="close"` は v1.20 で使える。**
   `Dialog` が `ButtonContext` に `close: { onPress }` を提供するため、
   `<Button slot="close">` で閉じる。`children` の render prop
   `{({ close }) => ...}` も使えるが、単純な閉じるボタンなら `slot="close"` が簡潔。

6. **フォーカス時のアウトラインは既存グローバル CSS が処理する。**
   `panda.config.ts` の `globalCss` に `[tabindex="-1"]:focus { outline: none !important }`
   がある。RAC の `Dialog`（`section`）は開いたときにフォーカスされ
   `tabindex="-1"` を持つため、このルールでアウトラインが消える。
   個別に `outline: none` を足す必要はない。

### `Dialog` に `aria-label` / 見出しが必要な点

RAC は `Dialog` 内に `<Heading slot="title">`（または `aria-label`）が無いと
開発時に警告を出す。本プロジェクトの両ダイアログは見出しがあるため問題なし。

---

## 4. テスト・検証

- `pnpm run test`（Vitest / workers pool）はドメインロジック中心で UI を
  レンダリングしないため、本移行で壊れない。
- `pnpm run typecheck`（tsc）は、**本フェーズ担当ファイル起因のエラーが無い**
  ことを確認済み。残るエラーは別エージェント担当ファイル
  （`bookmark-workbench-form.tsx`, `bookmark-editor/`, `src/features/tags/`）が
  まだ `@base-ui/react` を import していることによるもの。
- `pnpm run build` / `pnpm run dev` は、上記の別担当ファイルが
  `@base-ui/react` を解決できないため**現時点で失敗する**。これは本フェーズの
  責務外であり、別エージェントが移行し次第通るようになる。
- `markuplint`（a11y/マークアップ検査）は担当 4 ファイルとも pass。
- `oxlint` の `jsx-props-no-spreading` 警告は移行前から存在する既存警告。

### 動作確認（SSR スモークテストで検証済み、その後ファイルは削除）

- `StyledButton disabled` → DOM に `disabled` 属性が出る。
- `StyledButton type="submit"` → `type="submit"` が維持される。
- `StyledInput value/type/onValueChange` → ネイティブ `<input>` として描画。
- `DialogTrigger isOpen` + `ModalOverlay` + `Modal` + `Dialog` → クラッシュせず、
  トリガーに `aria-expanded` / `aria-controls` が付く（SSR では Modal は null）。

---

## 5. 後続エージェントへの引き継ぎ

- 未移行の `@base-ui/react` 直接 import は以下（別エージェント担当）。
  これらは RAC の `Input` / `Button` 等へ置き換える必要がある:
  - `src/features/bookmarks/components/bookmark-workbench-form.tsx`
  - `src/features/bookmarks/components/bookmark-editor/bookmark-form/fields.tsx`
  - `src/features/tags/components/inline-add-tag.tsx`
  - `src/features/tags/components/tag-form.tsx`
- 上記が `Input` を `onValueChange` 付きで使う場合は、
  `StyledInput` を使うと `onValueChange` 互換がそのまま使える。
  素の RAC `Input` に置き換えるなら `onValueChange` → `onChange`
  （`event.currentTarget.value`）への書き換えが必要。
- `disabled` を使うボタンは `isDisabled` へ。`onClick` は RAC でも動くが
  新規コードは `onPress` 推奨。
- ダイアログは本ノートの構造マッピングと `isDismissable` の項を参照。
