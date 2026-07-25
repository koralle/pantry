# コンポーネント配置整理

## Goal

- 共有 UI と画面専用 UI の配置を、指定された `src/shared/components` と route co-location に整理する。
- 既存の DOM、ルーティング、フォーム送信、表示、アクセシビリティ動作を変更しない。
- 既存実装がない `TagForm`、`TagTableSkeleton`、`TagColorDot` は、重複を解消する最小限の component として抽出する。
- `Button`、`Input` などの共有 UI primitive は `src/shared/components` が所有する。

## Scope

### Shared components

次の既存 component と共有 UI primitive を `src/shared/components/` に置く。

| Component / module                  | Source                                  | Target                                     |
| ----------------------------------- | --------------------------------------- | ------------------------------------------ |
| `UiLoading` / `UiEmpty` / `UiError` | `src/components/ui-state.tsx`           | `src/shared/components/ui-state.tsx`       |
| `ErrorFallback`                     | `src/components/error-fallback.tsx`     | `src/shared/components/error-fallback.tsx` |
| `Button`                            | `src/styles/button.ts`                  | `src/shared/components/button.tsx`         |
| `Input`                             | Base UI `Input` と `src/styles/form.ts` | `src/shared/components/input.tsx`          |
| `Select`                            | native `select` と `src/styles/form.ts` | `src/shared/components/select.tsx`         |
| `textLink`                          | `src/styles/primitives.ts`              | `src/shared/components/link.tsx`           |
| `TagChip`                           | `src/styles/tag-chip.ts`                | `src/shared/components/tag-chip.tsx`       |
| success / error summary recipes     | `flash` / `formSummary`                 | `src/shared/components/alert.ts`           |
| `Skeleton`                          | `src/styles/feedback.ts`                | `src/shared/components/skeleton.tsx`       |
| `Spinner`                           | `src/styles/feedback.ts`                | `src/shared/components/spinner.tsx`        |
| `Surface`                           | `src/styles/primitives.ts`              | `src/shared/components/surface.tsx`        |
| `TagColorDot`                       | tag shelf/table/detail の inline 実装   | `src/shared/components/tag-color-dot.tsx`  |

本変更で `src/shared/components/` に移すのは、`src/styles/*` にある shared recipe set である。React component を render しない shared recipe も含め、`srOnly` は `a11y.ts`、field layout は `form.ts`、workbench layout は `workbench.ts`、dialog styling は `dialog.tsx` に置く。各 module は対応する React wrapper がある場合は wrapper と recipe export の両方を所有する。別の shared style directory は作成しない。route-local component 固有の recipe はその component と co-location し、`TagTableSkeleton` の table/skeleton layout recipe も route-local のままとする。`cx` は Panda generated utility で recipe ではないため、route-local component は `styled-system/css` から直接 import を維持できる。

すべての live style export の移行先は次のとおり。`cx` は `style-utils.ts` から export し、`src/styles/ui.ts` の 18 consumer はこの表の明示的な module import に移行してから aggregation file を削除する。

| Source export                                                                                      | Destination module                     |
| -------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `button`                                                                                           | `src/shared/components/button.tsx`     |
| `fieldInput`                                                                                       | `src/shared/components/input.tsx`      |
| `formControl`                                                                                      | `src/shared/components/select.tsx`     |
| `textLink`                                                                                         | `src/shared/components/link.tsx`       |
| `tagChip`                                                                                          | `src/shared/components/tag-chip.tsx`   |
| `flash`, `formSummary`, `formSummaryTitle`, `formSummaryList`                                      | `src/shared/components/alert.ts`       |
| `field`, `fieldLabel`, `fieldError`, `fieldUrlRow`                                                 | `src/shared/components/form.ts`        |
| `skeleton`                                                                                         | `src/shared/components/skeleton.tsx`   |
| `spinner`                                                                                          | `src/shared/components/spinner.tsx`    |
| `stateBox`, `stateMessage`, `stateErrorMessage`                                                    | `src/shared/components/ui-state.tsx`   |
| `surface`                                                                                          | `src/shared/components/surface.tsx`    |
| `srOnly`                                                                                           | `src/shared/components/a11y.ts`        |
| `workbench`, `workbenchFields`, `workbenchForm`, `workbenchLead`, `workbenchNav`, `workbenchTitle` | `src/shared/components/workbench.ts`   |
| `dialog`, `dialogActions`, `dialogBackdrop`, `dialogTitle`                                         | `src/shared/components/dialog.tsx`     |
| `cx`                                                                                               | `src/shared/components/style-utils.ts` |

### Route-local components

| Component                    | Source                                                                    | Target                                                          |
| ---------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `BookmarkWorkbenchForm`      | `src/routes/_protected/bookmarks/-components/bookmark-workbench-form.tsx` | 現在地を維持                                                    |
| `TagSelector`                | `src/features/bookmarks/components/tag-selector.tsx`                      | `src/routes/_protected/bookmarks/-components/tag-selector.tsx`  |
| `TagEditFields`              | `src/features/tags/components/tag-edit-fields.tsx`                        | `src/routes/_protected/tags/-components/tag-edit-fields.tsx`    |
| `TagForm`                    | tag new/edit route 内の重複実装                                           | `src/routes/_protected/tags/-components/tag-form.tsx`           |
| `TagTable`                   | `src/features/tags/tag-table.tsx`                                         | `src/routes/_protected/tags/-components/tag-table.tsx`          |
| `InlineAddTag`               | `src/features/tags/components/inline-add-tag.tsx`                         | `src/routes/_protected/tags/-components/inline-add-tag.tsx`     |
| `TagTableSkeleton`           | tags index route のローカル関数                                           | `src/routes/_protected/tags/-components/tag-table-skeleton.tsx` |
| `ShelfNav` / `ShelfNavAsync` | `src/features/tags/components/shelf-nav.tsx`                              | `src/routes/_protected/-components/shelf-nav.tsx`               |
| `PantryMotion`               | `src/components/pantry-motion.tsx`                                        | `src/routes/_protected/-components/pantry-motion.tsx`           |
| `BookmarkTable`              | `src/features/bookmarks/components/bookmark-table.tsx`                    | `src/routes/_protected/-components/bookmark-table.tsx`          |
| `EntranceBoxes`              | `src/features/tags/components/entrance-boxes.tsx`                         | `src/routes/_protected/-components/entrance-boxes.tsx`          |

指定された配置を優先する。したがって、route-local component を feature component が import する箇所が生じても、本変更では feature 境界の再設計を行わない。

## Design

### Shared primitives

共有 primitive は全利用箇所を一括で同じ DOM に置換しない。`Button`、`Input`、`Select`、`TagChip`、`Skeleton`、`Spinner`、`Surface` は、それぞれ native element または Base UI primitive を包む薄い React component を提供する。同時に、TanStack Router `Link` や Base UI Dialog trigger のように polymorphic props を持つ呼び出し元のため、同じ module から対応する style recipe を export する。

この方針により、既存の `to`、`params`、`search` の型推論、`data-*` 属性、`aria-*` 属性、`onValueChange` を保ったまま style の所有権だけを shared module に集められる。React の `Link` / `TextLink` wrapper は現在存在しないため追加しない。TanStack Router `Link` は直接使用を続け、polymorphic caller は `link.tsx` の lowercase `textLink` recipe を使う。

`Input` wrapper は `fieldInput` を適用する styled caller だけに使う。source HEAD で unstyled Base UI `Input` を使う `TagSelector` は wrapper に置換せず、直接 import と current DOM/display を維持する。

`Button` は native `button` props と `button` recipe の `visual` variant を受け、`className` を recipe class と merge する。native `<button className={button({ visual })}>` の DOM と生成 class を維持できる call site だけを `<Button visual={visual}>` に置換し、polymorphic caller は recipe を直接使う。

`Alert` という既存 common component はない。`flash` を使う成功通知の DOM は標準化しない。bookmark detail の `newBookmarkCreated` と `bookmarkUpdated` はそれぞれ既存の `<div role='alert'>` を、tag detail の `newTagCreated` と `tagUpdated` はそれぞれ既存の `<output>` を維持する。4 call site すべてで element と ARIA attribute（`role='alert'` と icon の `aria-hidden` を含む）を変更しない。form error summary も `formSummary` recipe を適用する既存の `<div>` のままとする。`alert.ts` は `flash`、`formSummaryTitle`、`formSummaryList` を含む recipe export だけを提供し、DOM を変更する wrapper は導入しない。

### Tag form extraction

`TagForm` は新規・編集 route が共通に持つ name field、pinned、color、sort order、pending state、エラー表示を所有する。route は `addTag` / `updateTag`、`navigate`、`router.invalidate`、成功時の state を所有する。

`TagForm` の props は次で固定する。

```ts
type TagFormValues = {
  name: string
  pinned: boolean
  color: string | null
  sortOrder: number
}

type TagFormProps = {
  initialValues: TagFormValues
  legend: string
  submitLabel: string
  pendingLabel: string
  onSubmit: (values: TagFormValues) => Promise<void>
  getErrorMessage?: (error: unknown) => string
}
```

編集 route は loader から得た tag を `initialValues` として渡す。新規 route は空 name、`false`、`null`、`0` を渡す。タグ名重複エラーの文言差分だけ、新規 route が `getErrorMessage` を渡す。

### Tag color dot extraction

`TagColorDot` は `color`、`size`、`tone`、`className`、`label` を受ける装飾的な色丸として抽出する。`tone='neutral'` は `fg.muted` background を持つ shared recipe variant とし、all-tags shelf item の現在の muted dot visual を維持する。`label` がない場合は `aria-hidden='true'` を持つ dot `span` だけを返す。`label` がある場合は Fragment を返し、同じ `aria-hidden='true'` dot `span` の直後に separate visually-hidden label `span` を sibling として置く。これにより tag table の既存 DOM/ARIA structure を保つ。DB 由来の `color` は runtime value なので tag tone では `style={{ backgroundColor: color }}` を維持する。

### Search helper ownership

`ShelfNav` を protected route に移しても、`tagShelfSearch` と `allShelfSearch` は tag table、tag detail、entrance でも使う。UI component とともに移動させず、`src/routes/_protected/-lib/shelf-search.ts` に抽出する。各利用元はこの helper を直接 import する。

## Constraints

- 移動と共通化は同一 PR で行うが、UI 再設計は行わない。
- public export 名と props は、`TagForm` を除き既存の呼び出し側に合わせる。
- `ErrorFallback` は未使用でも移動する。削除は本変更の対象外とする。
- generated file と route tree は手編集しない。
- `src/shared/components` は新設する。既存の `src/components` は移行完了後に空なら削除する。

## Verification

1. `pnpm run format:check`、`pnpm run lint`、`pnpm run typecheck`、`pnpm run test`、`pnpm run build` を実行する。
2. bookmark 新規・編集でタグ選択、タグ新規作成、タイトル取得、送信エラーを確認する。
3. tag 新規・編集で色、pin、並び順、pending、重複名エラーを確認する。
4. tag 一覧で loading skeleton、empty/error state、色 dot、一覧追加を確認する。
5. desktop rail と mobile shelf sheet で ShelfNav の選択・遷移を確認する。
6. entrance/list/card 切替、bookmark table の詳細遷移、通常と reduced-motion の PantryMotion を確認する。
