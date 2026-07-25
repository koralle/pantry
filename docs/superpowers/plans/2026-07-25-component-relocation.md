# コンポーネント配置整理 実装計画

> **エージェント実行者向け:** この計画を実行するには、必ず `superpowers:subagent-driven-development`（推奨）または `superpowers:executing-plans` を使い、task ごとに進める。進捗はチェックボックス（`- [ ]`）で管理する。

**目的:** shared UI を `src/shared/components` に、指定された画面専用 UI を route `-components` に配置し、現在の表示と操作を保つ。

**アーキテクチャ:** 既存 component は rename/move と import 更新だけを行う。存在しない `TagForm`、`TagTableSkeleton`、`TagColorDot` だけを抽出する。`src/styles/*` の shared recipe set は対応する `src/shared/components` module に移し、wrapper が必要なものは recipe export とともに所有する。route-local component 固有の recipe は co-location を維持する。TanStack Router と Base UI の特殊な props、既存 DOM、UI behavior は変えない。

**技術スタック:** React 19、TanStack Start、TanStack Router、Base UI、Formisch、Panda CSS、Vitest、oxlint、TypeScript (`tsc`)。

**設計書:** `docs/superpowers/specs/2026-07-25-component-relocation-design.md`

---

## ファイル構成

| 区分              | ファイル                                            | 責務                                                                 |
| ----------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| shared UI         | `src/shared/components/*.{ts,tsx}`                  | component wrapper と、移行対象の shared Panda recipe / style utility |
| protected shell   | `src/routes/_protected/-components/*.tsx`           | shelf navigation、motion、bookmark table、entrance presentation      |
| bookmark routes   | `src/routes/_protected/bookmarks/-components/*.tsx` | bookmark 新規・編集 form と tag selector                             |
| tag routes        | `src/routes/_protected/tags/-components/*.tsx`      | tag 編集 field/form/table/一覧追加/skeleton                          |
| protected helpers | `src/routes/_protected/-lib/shelf-search.ts`        | UI 配置に依存しない shared shelf search parsing                      |

## 共通ルール

- 既存の prop、ARIA attribute、route path、pending label、Panda visual variant をすべて維持する。
- 既存 file の移動には `git mv` を使う。生成物の `src/routeTree.gen.ts` は手編集しない。
- `TagForm` は新規・編集で重複する form body だけに使う。server function、navigation、invalidation は route file に残す。
- runtime tag color は inline `backgroundColor` のままにする。これは static design token ではなく database value である。
- 依頼がない限り commit しない。

---

### Task 1: shared directory を作成し、既存の shared component を移動する

**ファイル:**

- 作成: `src/shared/components/`
- 移動: `src/components/ui-state.tsx` -> `src/shared/components/ui-state.tsx`
- 移動: `src/components/error-fallback.tsx` -> `src/shared/components/error-fallback.tsx`
- 作成: `src/shared/components/skeleton.tsx` と `src/shared/components/spinner.tsx`
- 変更: `src/styles/feedback.ts` を temporary forwarding re-export module に置換
- 変更: `components/ui-state` と `components/error-fallback` の全 import

- [ ] **Step 1: shared directory を作成し、2 file を移動する**

実行:

```bash
  mkdir -p src/shared/components
```

- [ ] **Step 2: ui-state が使う feedback recipe を同時に移す**

`src/styles/feedback.ts` の `stateBox`、`stateMessage`、`stateErrorMessage` を移動後の `ui-state.tsx` に定義する。`skeleton` は `src/shared/components/skeleton.tsx`、`spinner` は `src/shared/components/spinner.tsx` に移す。Panda style object と export 名は維持し、recipe declaration は移動後の module にだけ存在させる。

`src/styles/ui.ts` は Task 6 の consumer migration まで `./feedback` から同じ 5 export を re-export し続けるため、`src/styles/feedback.ts` は declaration を削除した後に次の temporary forwarding re-export module に置換する。

```ts
export { skeleton } from '../shared/components/skeleton'
export { spinner } from '../shared/components/spinner'
export { stateBox, stateErrorMessage, stateMessage } from '../shared/components/ui-state'
```

この forwarding module は `src/styles/ui.ts` とともに consumer count が 0 になるまで残し、Task 8 で両方を削除する。これにより Task 1 の typecheck は通り、recipe は重複しない。

移動後の `ui-state.tsx` は invalid な `../styles/ui` import を残さない。Task 6 で `button.tsx` を作るまでは `button` を `../../styles/button` から、`skeleton` と `spinner` を同 directory の dedicated module から import する。

```ts
import { button } from '../../styles/button'
import { skeleton } from './skeleton'
import { spinner } from './spinner'
```

- [ ] **Step 3: state component の全 external import を置換する**

`src/routes/_protected.tsx`、bookmark list/detail/edit route、tag list/detail/edit route、`src/features/tags/tag-table.tsx`、`src/features/tags/components/entrance-boxes.tsx` の import を `components/ui-state` から `shared/components/ui-state` へ変更する。import 名と call site の props は変更しない。

```ts
import { UiError, UiLoading } from '../../../shared/components/ui-state'
```

- [ ] **Step 4: 移動後の compile を検証する**

実行: `pnpm run typecheck`

期待結果: `ui-state.tsx` が `../styles/ui` を参照せず、移動した state component の import がすべて解決して typecheck が成功する。

---

### Task 2: bookmark と protected shell の component を移動する

**ファイル:**

- 移動: `src/features/bookmarks/components/tag-selector.tsx` -> `src/routes/_protected/bookmarks/-components/tag-selector.tsx`
- 移動: `src/features/tags/components/shelf-nav.tsx` -> `src/routes/_protected/-components/shelf-nav.tsx`
- 移動: `src/components/pantry-motion.tsx` -> `src/routes/_protected/-components/pantry-motion.tsx`
- 移動: `src/features/bookmarks/components/bookmark-table.tsx` -> `src/routes/_protected/-components/bookmark-table.tsx`
- 移動: `src/features/tags/components/entrance-boxes.tsx` -> `src/routes/_protected/-components/entrance-boxes.tsx`
- 変更: 各 component の全 import

- [ ] **Step 1: Git で file を移動し、export を維持する**

実行:

```bash
mkdir -p src/routes/_protected/-components src/routes/_protected/bookmarks/-components
git mv src/features/bookmarks/components/tag-selector.tsx src/routes/_protected/bookmarks/-components/tag-selector.tsx
```

- [ ] **Step 2: 移動した component 自身の relative import を修正する**

各 file を移動した直後に、その implementation 内の relative import を新しい directory 基準で更新する。external consumer より先に実施する。

- `tag-selector.tsx`: `db/schema/tag`、`features/tags/tag-name.schema`、`features/tags/tag.function` の path を `src/routes/_protected/bookmarks/-components/` 基準に直す。
- `shelf-nav.tsx`: bookmark search schema、`features/tags/tag-shelf` の path を `src/routes/_protected/-components/` 基準に直す。
- `pantry-motion.tsx`: local relative import はないことを確認し、package import だけを維持する。
- `bookmark-table.tsx`: `lib/format-date` と `features/bookmarks/attach-bookmark-tags`、`features/bookmarks/shorten-url` の path を `src/routes/_protected/-components/` 基準に直す。style recipe は Task 6 の shared module import に置換するまで、解決する temporary path を使う。
- `entrance-boxes.tsx`: `Ui*` component、tag feature helper/type/function、ShelfNav search helper、style recipe の path を `src/routes/_protected/-components/` 基準に直す。Task 4 で ShelfNav search import を `-lib/shelf-search` に置換する。

`db`、`feature`、`style`、`component` の local import を file ごとに全件確認し、移動前の相対 path を残さない。

- [ ] **Step 3: bookmark import を更新する**

`bookmark-workbench-form.tsx` は sibling から `TagSelector` を import する。`bookmark-list.tsx` は protected route component directory から `BookmarkTable` と `PantryMotion` を import する。`BookmarkTable` の props `{ bookmarks, detailSearch? }` と `PantryMotion` の props `{ kind, children, className? }` は維持する。

```ts
import { TagSelector } from './tag-selector'
import { BookmarkTable } from '../../../routes/_protected/-components/bookmark-table'
import { PantryMotion } from '../../../routes/_protected/-components/pantry-motion'
```

- [ ] **Step 4: protected route import を更新する**

`src/routes/_protected.tsx` は `./_protected/-components/shelf-nav` から `ShelfNav` と `ShelfNavAsync` を import する。`src/routes/_protected/index.tsx` は `./-components/entrance-boxes` と `./-components/pantry-motion` からそれぞれ明示的に import する。barrel は作成しない。

- [ ] **Step 5: 対象を絞った静的検証を実行する**

実行: `pnpm run typecheck && pnpm run lint`

期待結果: 未解決の相対 import と lint error がない。

---

### Task 3: tag 一覧・編集 component を移動する

**ファイル:**

- 移動: `src/features/tags/components/tag-edit-fields.tsx` -> `src/routes/_protected/tags/-components/tag-edit-fields.tsx`
- 移動: `src/features/tags/tag-table.tsx` -> `src/routes/_protected/tags/-components/tag-table.tsx`
- 移動: `src/features/tags/components/inline-add-tag.tsx` -> `src/routes/_protected/tags/-components/inline-add-tag.tsx`
- 作成: `src/routes/_protected/tags/-components/tag-table-skeleton.tsx`
- 変更: `src/routes/_protected/tags/index.tsx`、tag 新規・編集・詳細 route、`shelf-nav.tsx` / `entrance-boxes.tsx` の import

- [ ] **Step 1: 既存 tag component を移動する**

実行:

```bash
mkdir -p src/routes/_protected/tags/-components
git mv src/features/tags/components/tag-edit-fields.tsx src/routes/_protected/tags/-components/tag-edit-fields.tsx
```

- [ ] **Step 2: 移動した tag component 自身の relative import を修正する**

`tag-edit-fields.tsx`、`tag-table.tsx`、`inline-add-tag.tsx` の implementation 内で、`db`、tag feature schema/function/palette/shelf helper/type、shared UI component、style recipe の local import を、`src/routes/_protected/tags/-components/` 基準に全件更新する。Task 2 で ShelfNav はすでに移動済みなので、Task 4 が search helper を抽出するまで `tag-table.tsx` は `../../-components/shelf-nav` から temporary に import し、Task 4 で `../../-lib/shelf-search` に置換する。Task 6 が style recipe を移すまで、style import も新しい directory 基準で解決させる。

- [ ] **Step 3: table fallback を markup と generated class behavior を変えずに抽出する**

現在の `TagTableSkeleton` function body と、それだけが使う `tagTable`、`tagTableCell`、`tagTableHeader`、`skeletonBase`、`skeletonDot`、`skeletonName`、`skeletonCount`、`skeletonPin`、`skeletonAction` recipe declaration を `src/routes/_protected/tags/index.tsx` から `tag-table-skeleton.tsx` に移し、export する。新 file は `css` と `cx` を `styled-system/css` から、shared `skeleton` recipe を `../../../../shared/components/skeleton` から import する。`srOnly` は Task 6 が `a11y.ts` を作るまで legacy `../../../../styles/ui` から import する。route 側では不要になった `cx`、`skeleton`、`srOnly`、移動した recipe declaration を削除する。その後、route fallback を次に置換する:

```tsx
<Suspense fallback={<TagTableSkeleton />}>
  <TagTable tagPromise={tagPromise} />
</Suspense>
```

5 列、5 行の skeleton、table accessibility attribute、Panda class composition (`cx(skeleton, skeletonBase, ...)`) は import declaration を除いて byte-for-byte で同一にする。recipe declaration も移動するため、生成される class behavior を変えない。

- [ ] **Step 4: tag component import を更新する**

`tags/new.tsx` と `tags/$id.edit.tsx` は `./-components/tag-edit-fields` から `TagEditFields` を import する。`tags/index.tsx` は `./-components/tag-table`、`./-components/inline-add-tag`、`./-components/tag-table-skeleton` からそれぞれ明示的に import する。barrel は作成しない。tags route tree 外の component も移動後の module を明示的な相対 path で import する。

- [ ] **Step 5: tag test suite を実行する**

実行: `pnpm vitest run src/features/tags/tag-shelf.test.ts src/features/tags/tag.function.test.ts src/features/tags/tag-name.schema.test.ts`

期待結果: 指定したテストがすべて成功する。

---

### Task 4: protected shelf search helper を抽出する

**ファイル:**

- 作成: `src/routes/_protected/-lib/shelf-search.ts`
- 変更: `src/routes/_protected/-components/shelf-nav.tsx`
- 変更: `src/routes/_protected/tags/-components/tag-table.tsx`
- 変更: `src/routes/_protected/tags/$id/index.tsx`
- 変更: `src/routes/_protected/-components/entrance-boxes.tsx`

- [ ] **Step 1: pure search helper を ShelfNav から移す**

`tagShelfSearch` と `allShelfSearch` を、ShelfNav が現在使う input/output type と default value のまま `shelf-search.ts` から export する。`shelf-nav.tsx` は宣言を持たず、これらの export を import する。

```ts
export function tagShelfSearch(tagName: string): BookmarkSearchSchema {
  return {
    limit: 50,
    offset: 0,
    view: 'list',
    tagMode: 'and',
    sort: 'newest',
    tags: [tagName]
  }
}

export function allShelfSearch(): BookmarkSearchSchema {
  return {
    limit: 50,
    offset: 0,
    view: 'list',
    tagMode: 'and',
    sort: 'newest'
  }
}
```

- [ ] **Step 2: navigation 以外の consumer を helper module に向ける**

tag table、tag detail、EntranceBoxes の temporary moved ShelfNav module からの import を置換する。既存の `Link` `search` value はすべて維持する。

- [ ] **Step 3: route search の型を確認する**

実行: `pnpm run typecheck`

期待結果: TanStack Router がすべての `search` value を cast なしで受け入れる。

---

### Task 5: TagForm を抽出し、新規・編集 route を移行する

**ファイル:**

- 作成: `src/routes/_protected/tags/-components/tag-form.tsx`
- 変更: `src/routes/_protected/tags/new.tsx`
- 変更: `src/routes/_protected/tags/$id.edit.tsx`
- 参照: `src/routes/_protected/tags/-components/tag-edit-fields.tsx`

- [ ] **Step 1: shared form value と props type を定義する**

`tag-form.tsx` に次の public type を定義する:

```ts
export type TagFormValues = {
  name: string
  pinned: boolean
  color: string | null
  sortOrder: number
}

export type TagFormProps = {
  initialValues: TagFormValues
  legend: string
  submitLabel: string
  pendingLabel: string
  onSubmit: (values: TagFormValues) => Promise<void>
  getErrorMessage?: (error: unknown) => string
}
```

- [ ] **Step 2: 重複する Formisch form body を TagForm に移す**

`useForm({ initialInput: { name: initialValues.name }, schema: v.object({ name: v.string() }) })`、`useActionState`、`TagEditFields` を使用する。local の `pinned`、`color`、`sortOrder` は `initialValues` で初期化する。失敗時は既存の generic `Error` message fallback より先に `getErrorMessage?.(error)` を呼ぶ。`formSummary` live region、disabled fieldset、required name input、accent submit button は維持する。

`tag-form.tsx` は Task 5 で Task 6 より先に作成される。form body の移植時に `styles/ui` import を使う場合でも、Task 6 で必ず matching shared component module の direct import に置換する。Task 8 で legacy aggregation file が削除される時点で、`tag-form.tsx` は `styles/ui` を import してはならない。

- [ ] **Step 3: 新規 route は作成、navigation、outer workbench layout を所有する**

`RegisterNewTagForm` を次に置換する:

```tsx
<TagForm
  initialValues={{ name: '', pinned: false, color: null, sortOrder: 0 }}
  legend='タグ新規登録'
  submitLabel='登録'
  pendingLabel='登録中...'
  onSubmit={submitAction}
  getErrorMessage={(error) =>
    error instanceof Error && error.name === 'TagNameAlreadyExistsError'
      ? 'そのタグ名は既に存在します'
      : error instanceof Error
        ? error.message
        : 'タグの作成に失敗しました'
  }
/>
```

- [ ] **Step 4: 編集 route は initial value と outer workbench layout を所有する**

既存の Suspense boundary 内で、読み込んだ tag を使って次を render する:

```tsx
<TagForm
  initialValues={{ name: tag.name, pinned: tag.pinned, color: tag.color, sortOrder: tag.sortOrder }}
  legend='タグ編集'
  submitLabel='更新'
  pendingLabel='更新中...'
  onSubmit={(values) => submitAction({ id: tag.id, ...values })}
/>
```

`router.invalidate()` と `navigate()` は編集 route の `submitAction` に残す。

- [ ] **Step 5: tag 作成・編集の動作を検証する**

実行: `pnpm run typecheck && pnpm run test`

期待結果: 全テストが成功する。ブラウザでは tag 作成、重複名送信、tag 編集を行い、color/pin/sort value が保持されることを確認する。

---

### Task 6: shared primitive module を作成し、style の所有権を移す

**ファイル:**

- 作成: `src/shared/components/button.tsx`
- 作成: `src/shared/components/input.tsx`
- 作成: `src/shared/components/select.tsx`
- 作成: `src/shared/components/link.tsx`
- 作成: `src/shared/components/tag-chip.tsx`
- 作成: `src/shared/components/alert.ts`
- 変更: Task 1 で作成した `src/shared/components/skeleton.tsx` と `src/shared/components/spinner.tsx`
- 作成: `src/shared/components/surface.tsx`
- 作成: `src/shared/components/a11y.ts`
- 作成: `src/shared/components/form.ts`
- 作成: `src/shared/components/workbench.ts`
- 作成: `src/shared/components/dialog.tsx`
- 作成: `src/shared/components/style-utils.ts`
- 移動元: `src/styles/button.ts`、`form.ts`、`tag-chip.ts`、`primitives.ts`、`workbench.ts`、`dialog.ts`。`feedback.ts` の全 recipe は Task 1 で移動済みで、Task 8 まで forwarding re-export module として残る
- 変更: `src/styles/ui.ts` の 18 consumer と、移動元 style module の全 import

- [ ] **Step 1: recipe を対応する shared component module に移す**

`src/styles/*` の shared recipe set について、Panda style object と export 名を変更せず、残りの recipe を次の module に配置する。DOM を render しない shared recipe も `src/shared/components` に置く。`skeleton.tsx`、`spinner.tsx`、`ui-state.tsx` の recipe は Task 1 で移動済みなので再定義しない。route-local `TagTableSkeleton` の `tagTable*` / `skeleton*` layout recipe は Task 3 の component file に残す。`cx` は Panda generated utility で recipe ではないため、Task 3 は `styled-system/css` からの direct import を維持する。別の shared style directory は作成しない。

| Destination      | Exports                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| `button.tsx`     | `button`                                                                                           |
| `input.tsx`      | `fieldInput`、`Input`                                                                              |
| `select.tsx`     | `formControl`、`Select`                                                                            |
| `link.tsx`       | `textLink`                                                                                         |
| `tag-chip.tsx`   | `tagChip`、必要な `TagChip` wrapper                                                                |
| `alert.ts`       | `flash`、`formSummary`、`formSummaryTitle`、`formSummaryList`                                      |
| `form.ts`        | `field`、`fieldLabel`、`fieldError`、`fieldUrlRow`                                                 |
| `skeleton.tsx`   | `skeleton`、必要な `Skeleton` wrapper                                                              |
| `spinner.tsx`    | `spinner`、必要な `Spinner` wrapper                                                                |
| `ui-state.tsx`   | `stateBox`、`stateMessage`、`stateErrorMessage`、`UiLoading`、`UiEmpty`、`UiError`                 |
| `surface.tsx`    | `surface`、必要な `Surface` wrapper                                                                |
| `a11y.ts`        | `srOnly`                                                                                           |
| `workbench.ts`   | `workbench`、`workbenchFields`、`workbenchForm`、`workbenchLead`、`workbenchNav`、`workbenchTitle` |
| `dialog.tsx`     | `dialog`、`dialogActions`、`dialogBackdrop`、`dialogTitle`                                         |
| `style-utils.ts` | `cx`                                                                                               |

`alert.ts` は common `Alert` component を追加しない。bookmark detail の `newBookmarkCreated` と `bookmarkUpdated` は既存の `<div role='alert'>` を、tag detail の `newTagCreated` と `tagUpdated` は既存の `<output>` を維持する。成功 flash を共通 DOM に置換せず、4 call site の element と ARIA attribute（`role='alert'` と icon の `aria-hidden` を含む）を変更しない。`formSummary` を使う error summary も既存の `<div>` を維持する。`dialog.tsx` は bookmark detail の live Base UI `Dialog` call site が class recipe を直接使えるよう、dialog recipe のみを export する。

- [ ] **Step 2: class を merge する薄い primitive component を作成する**

各 wrapper は native/Base UI props と `className` を受け取り、所有する recipe を `cx` で適用して、残りの props をすべて forward する。Input wrapper は Base UI の `onValueChange` contract を維持する。

```tsx
import { Input as BaseInput } from '@base-ui/react'
import type { ComponentProps } from 'react'

import { cx } from './style-utils'

export function Input({ className, ...props }: ComponentProps<typeof BaseInput>) {
  return (
    <BaseInput
      {...props}
      className={cx(fieldInput, className)}
    />
  )
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      {...props}
      className={cx(formControl, className)}
    />
  )
}
```

- [ ] **Step 3: recipe export で polymorphic caller の動作を維持する**

`link.tsx` は lowercase `textLink` を定義・export し、`button.tsx` は `button` を、`tag-chip.tsx` は `tagChip` を定義・export する。React `Link` / `TextLink` wrapper は作成しない。既存の TanStack Router `Link` は直接使用し、generic route props を保つため `textLink` recipe を className に使う。Base UI Dialog も `dialog.tsx` の recipe export を直接使い続ける。

`src/styles/button.ts`、`src/styles/primitives.ts`、`src/styles/tag-chip.ts` の current Panda style object を abbreviated に書き直さない。対応 module へ byte-for-byte で移し、`textLink` の `textDecoration: 'none'` を含む既存の declaration を変更しない。

```tsx
<Link className={textLink}>
  一覧へ戻る
</Link>

<button className={button({ visual: 'accent' })}>
  保存
</button>
```

- [ ] **Step 4: props 互換のある箇所で direct Base UI input と native select を置換する**

sign-in、bookmark workbench、`src/routes/_protected/tags/-components/tag-form.tsx`、inline add tag の `import { Input } from '@base-ui/react'` を shared `Input` wrapper に置換する。bookmark list の native select を shared `Select` に置換する。既存の `id`、`type`、`value`、`onValueChange`、`onChange`、`required`、`disabled` props は維持する。

`src/routes/_protected/bookmarks/-components/tag-selector.tsx` は source HEAD で unstyled Base UI `Input` を使うため、shared wrapper に置換しない。`fieldInput` を追加せず、`@base-ui/react` からの direct `Input` import と current DOM/display を維持する。

- [ ] **Step 5: `src/styles/ui.ts` の 18 consumer を明示的な module import に移行する**

次の matrix は `styles/ui` の 18 consumer、display preservation のため wrapper migration を免除する TagSelector、Task 5 で新設する TagForm を示す。18 consumer は `styles/ui` import を削除し、recipe は Step 1 の destination module から直接 import し、`cx` は `style-utils.ts` から import する。TagForm は Task 6 で legacy import を direct shared module import に置換する。Task 5 で form-specific style は TagForm に移す一方、tags/new と tags/$id.edit は outer workbench layout と text link を所有し続けるため、aggregation import は `workbench` と `link` の direct import に置換する。

| Original consumer                                                         | Migration                                                                                                                                                                                                 |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/sign-in/-components/sign-in-with-email-and-password-form.tsx` | `button`、`form`、`input`、`alert`、`a11y`、`workbench` を直接 import                                                                                                                                     |
| `src/routes/_protected.tsx`                                               | `button` を直接 import                                                                                                                                                                                    |
| `src/routes/_protected/bookmarks/$id/edit.tsx`                            | `link` と `workbench` を直接 import                                                                                                                                                                       |
| `src/routes/_protected/bookmarks/$id/index.tsx`                           | `button`、`style-utils`、`dialog`、`form`、`alert`、`skeleton`、`a11y`、`tag-chip`、`link`、`workbench` を直接 import                                                                                     |
| `src/routes/_protected/bookmarks/new/index.tsx`                           | `link` と `workbench` を直接 import                                                                                                                                                                       |
| `src/routes/_protected/bookmarks/-components/bookmark-workbench-form.tsx` | `button`、`form`、`input`、`alert`、`a11y`、`workbench` を直接 import                                                                                                                                     |
| `src/routes/_protected/bookmarks/-components/tag-selector.tsx`            | `styles/ui` consumer ではない。unstyled Base UI `Input` を direct import のまま維持し、shared `Input` / `fieldInput` は適用しない                                                                         |
| `src/routes/_protected/tags/$id/index.tsx`                                | `button`、`alert`、`link`、`workbench` を直接 import                                                                                                                                                      |
| `src/shared/components/ui-state.tsx`                                      | `button`、`skeleton`、`spinner` を直接 import。state recipe は同 file で定義する                                                                                                                          |
| `src/routes/_protected/tags/new.tsx`                                      | `link` から `textLink`、`workbench` から `workbench`、`workbenchNav`、`workbenchTitle`、`workbenchLead` を直接 import。form-specific style は Task 5 の `TagForm` が所有する                              |
| `src/routes/_protected/tags/$id.edit.tsx`                                 | `link` から `textLink`、`workbench` から `workbench`、`workbenchNav`、`workbenchTitle`、`workbenchLead` を直接 import。form-specific style は Task 5 の `TagForm` が所有する                              |
| `src/routes/_protected/tags/-components/tag-form.tsx`                     | `styles/ui` の recipe import を残さない。必要な recipe を `button.tsx`、`form.ts`、`input.tsx`、`alert.ts`、`a11y.ts`、`workbench.ts` から直接 import する                                                |
| `src/features/bookmarks/components/bookmark-list.tsx`                     | `button`、`style-utils`、`select`、`a11y`、`surface`、`tag-chip` を直接 import                                                                                                                            |
| `src/routes/_protected/tags/index.tsx`                                    | `button` を直接 import。Task 3 が抽出した `tag-table-skeleton.tsx` は `skeleton` を shared module から使い、temporary legacy `srOnly` import を Task 6 で `../../../../shared/components/a11y` に置換する |
| `src/routes/_protected/-components/bookmark-table.tsx`                    | `tag-chip` を直接 import                                                                                                                                                                                  |
| `src/routes/_protected/settings/index.tsx`                                | `button` と `link` を直接 import                                                                                                                                                                          |
| `src/routes/_protected/tags/-components/tag-edit-fields.tsx`              | `button`、`form`、`select` を直接 import                                                                                                                                                                  |
| `src/routes/_protected/tags/-components/inline-add-tag.tsx`               | `button`、`form`、`input` を直接 import                                                                                                                                                                   |
| `src/routes/_protected/-components/entrance-boxes.tsx`                    | `surface` と `link` を直接 import                                                                                                                                                                         |
| `src/routes/_protected/tags/-components/tag-table.tsx`                    | `a11y` と `link` を直接 import                                                                                                                                                                            |

- [ ] **Step 6: aggregation file を参照数が 0 になるまで残す**

`src/styles/ui.ts` はこの task の consumer migration 中は残す。次の command が 0 件を返すことを確認するまで削除しない。

```bash
rg "from ['\"].*styles/ui['\"]" src
```

- [ ] **Step 7: format と型の検証を実行する**

実行: `pnpm run format:check && pnpm run lint && pnpm run typecheck`

期待結果: すべての command が成功し、Base UI と TanStack Router の call site に API 非互換がない。

---

### Task 7: TagColorDot を抽出し、重複する dot markup を置換する

**ファイル:**

- 作成: `src/shared/components/tag-color-dot.tsx`
- 変更: `src/routes/_protected/-components/shelf-nav.tsx`
- 変更: `src/routes/_protected/tags/-components/tag-table.tsx`
- 変更: `src/routes/_protected/tags/$id/index.tsx`

- [ ] **Step 1: color-dot API を定義する**

```ts
export type TagColorDotProps = {
  color: string | null | undefined
  size?: 'sm' | 'md'
  tone?: 'tag' | 'neutral'
  label?: string
  className?: string
}
```

`TagColorDot` は現在の size/border/radius を持つ `tagColorDot` recipe を dot `span` に適用する。recipe の `tone: 'neutral'` variant は `background: 'fg.muted'` を定義し、inline style を省略しても muted visual が残るようにする。`tone: 'tag'` は current base background を持ち、DB runtime color がある場合だけ `style={{ backgroundColor: color }}` を設定する。`label` がない場合は `aria-hidden='true'` を持つ dot `span` だけを返す。`label` がある場合は Fragment を返し、同じ aria-hidden dot `span` と separate visually-hidden label `span` を sibling として render する。label を dot の child にしない。

- [ ] **Step 2: 重複する 3 箇所の dot rendering を置換する**

Shelf navigation は tag item に `size='sm' tone='tag'`、all-tags item に `size='sm' tone='neutral'` を使う。後者は current `shelfDotNeutral` と同じ `fg.muted` background を recipe variant で維持する。tag table は現在の color-name screen-reader text を `label` に渡し、aria-hidden dot と visually-hidden label span の sibling structure を維持する。tag detail は `size='md' tone='tag'` を使い dot span のみを render する。tag color は全箇所で runtime inline `backgroundColor` のままにし、各 existing `aria-hidden` / label behavior を維持する。

- [ ] **Step 3: tag color state を検証する**

実行: `pnpm run typecheck && pnpm run test && pnpm run build`

期待結果: すべての command が成功する。色あり・色なしの tag と、すべての tag を示す shelf item を手動確認する。

---

### Task 8: obsolete directory を削除し、完全検証する

**ファイル:**

- 空なら削除: `src/components/`
- 空なら削除: 移動元の `src/features/bookmarks/components/` と `src/features/tags/components/`
- 削除: 全 export と 18 consumer の移行後の `src/styles/ui.ts`、`button.ts`、`form.ts`、`tag-chip.ts`、`feedback.ts`、`primitives.ts`、`workbench.ts`、`dialog.ts`
- 変更: 残っている古い import

- [ ] **Step 1: 古い import path が残っていないことを確認する**

実行:

```bash
rg "from ['\"](\.\./)+(components/(ui-state|error-fallback|pantry-motion)|features/bookmarks/components/(tag-selector|bookmark-table)|features/tags/components/(tag-edit-fields|inline-add-tag|shelf-nav|entrance-boxes)|features/tags/tag-table|styles/(ui|button|form|tag-chip|feedback|primitives|workbench|dialog))['\"]" src
```

期待結果: 結果がない。`src/styles/ui.ts` と、移行元の 7 style module はすべて削除対象なので、残存 import は許容しない。

- [ ] **Step 2: 空の directory だけを削除する**

実行:

```bash
rm src/styles/ui.ts src/styles/button.ts src/styles/form.ts src/styles/tag-chip.ts src/styles/feedback.ts src/styles/primitives.ts src/styles/workbench.ts src/styles/dialog.ts
rmdir src/components 2>/dev/null || true
rmdir src/features/bookmarks/components 2>/dev/null || true
rmdir src/features/tags/components 2>/dev/null || true
```

`rm` の前に Step 1 の scan が 0 件であること、移動元の各 export が Task 6 の destination module に存在することを確認する。削除後、同じ scan を再実行して import と source file がともに残っていないことを確認する。

- [ ] **Step 3: 完全な automated verification を実行する**

実行:

```bash
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

期待結果: すべての command が終了コード 0 で完了する。

- [ ] **Step 4: 設計書の browser smoke check を実行する**

bookmark 新規・編集、tag 新規・編集、tag 一覧の loading/error、desktop/mobile ShelfNav、entrance/list/card transition、keyboard focus を確認する。route navigation と form action が baseline と一致することを確認する。
