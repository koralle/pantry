# app.css から Panda CSS への段階移行 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/app.css` と `kiso.css` 依存を削除し、表示と操作を変えずに Panda CSS を唯一のアプリケーション style 所有者にする。

**Architecture:** 一度に class を置換しない。Panda theme と Kiso と同じ適用範囲の global reset を追加した後、共有 UI、タグ、ブックマーク、アプリフレームの順にコンポーネントを移す。移行済み要素は Panda class だけを使い、未移行要素は旧 CSS のまま動かす。旧 variable、keyframe、Kiso は、最後の旧 selector を消すまで比較基準として残す。

**Tech Stack:** React 19、TanStack Start、Base UI、Panda CSS 1.11.4、PostCSS、Vitest、Playwright MCP、oxlint、tsgo。

**Spec:** `docs/superpowers/specs/2026-07-23-panda-css-migration-design.md`

---

一括置換では、差分が token の誤りなのか component の移植漏れなのか分からなくなる。最初に色と cascade を固定し、その上で画面を小さく移す。崩れたときに戻る場所が一つに絞れる。

## 変更対象

| 区分         | ファイル                                                                                      | 責務                                                            |
| ------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Panda 基盤   | `panda.config.ts`                                                                             | token、semantic token、keyframe、animation style、global CSS    |
| CSS 入口     | `src/app.css`、`src/index.css`、`src/routes/__root.tsx`                                       | 移行中の legacy CSS、最終 Panda layer entry、root の CSS import |
| 共通 UI      | `src/styles/ui.ts`（新規）、`src/components/pantry-motion.tsx`、`src/components/ui-state.tsx` | shared recipe、form control、視覚的非表示、状態表示、animation  |
| タグ・認証   | `src/routes/sign-in/**`、`src/features/tags/**`、`src/routes/_protected/tags/**`              | 玄関、棚、タグ管理、タグ編集、サインイン                        |
| ブックマーク | `src/features/bookmarks/components/**`、`src/routes/_protected/bookmarks/**`                  | 一覧、テーブル、カード、詳細、フォーム、削除 dialog             |
| アプリ frame | `src/routes/_protected.tsx`、`src/routes/_protected/settings/index.tsx`                       | desktop rail、mobile sheet、header、settings                    |

## 共通ルール

- 新しい component style は `css()` で定義し、複数機能が同じ visual contract を使う場合だけ `src/styles/ui.ts` へ置く。
- `cva()` を使うのは Button と TagChip だけにする。grid、table、detail、dialog は各 component の top-level `css()` に置く。
- `Link`、`Dialog`、`button`、`input`、`select` の DOM 構造と ARIA 属性は変えない。style を子孫 selector から対象要素自身へ移すだけにする。
- `tag.color` と palette value の `style={{ backgroundColor: ... }}` は残す。これは永続データから来る runtime color であり、Panda token にできない。
- static な `style` 属性と `.pantry-*` class は新規に増やさない。
- 各 task の完了後、その task で移した selector だけを `src/app.css` から削除する。未移行 selector、`:root` variable、旧 keyframe、Kiso import は最終 task まで削除しない。
- コミットは依頼された場合だけ行う。

## 比較基準

最初に次の viewport で現行を確認する。`640px` は card grid、`768px` は rail と mobile shelf の切替点である。

| 幅            | 確認すること                                                        |
| ------------- | ------------------------------------------------------------------- |
| 375px         | touch target、mobile header、bottom shelf sheet、single-column card |
| 639px / 640px | bookmark card の 1 列から 2 列への切替                              |
| 767px / 768px | mobile header/sheet から desktop rail への切替                      |
| 1280px        | rail、table、detail、form の最大幅                                  |

実ブラウザでは、サインイン、玄関、タグ色あり/なし、一覧の AND/OR と table/card、ブックマーク登録・編集・削除、タグ作成・編集、設定のログアウトを確認する。ローディング、エラー、disabled、`aria-pressed`、`data-selected`、keyboard focus、reduced motion も対象に含める。

---

### Task 1: 比較基準を作る

**Files:**

- Modify: なし
- Reference: `docs/testing.md:19-35`

- [ ] **Step 1: 開発サーバーを起動する**

Run: `pnpm run dev`

Expected: Vite/workerd が `http://localhost:3000` で待受状態になる。

- [ ] **Step 2: 上記 4 種類の viewport で主要フローを操作し、screenshot を保存する**

Playwright MCP を使い、画面名・viewport・状態が分かる名前で保存する。最低限、`sign-in`、`entrance`、`bookmark-list-card`、`bookmark-list-table`、`bookmark-detail`、`tag-admin`、`settings`、`mobile-shelf-sheet` を撮る。

- [ ] **Step 3: 現行の motion と focus を記録する**

通常設定と `prefers-reduced-motion: reduce` の両方で、`PantryMotion`、spinner、focus-visible outline の表示を確認する。移行後に変わってよい項目はない。

---

### Task 2: Panda theme と global reset を追加する

**Files:**

- Modify: `panda.config.ts`
- Modify: `src/app.css`
- Reference: `src/index.css`、`src/app.css:4-25, 289-350, 1202-1246`、`node_modules/kiso.css/kiso.css`

- [ ] **Step 1: Panda token を追加する**

`panda.config.ts` の `theme.extend` に次の literal token を追加する。値は `src/app.css:5-12` と、同ファイルで使われる `#fff`、`#8a2f2f` をそのまま採用する。

```ts
tokens: {
  colors: {
    pantry: {
      canvas: { value: '#f7f6f3' },
      ink: { value: '#1c1b19' },
      muted: { value: '#5c5955' },
      line: { value: '#d9d4cc' },
      accent: { value: '#2f6f6a' },
      surface: { value: '#fff' },
      danger: { value: '#8a2f2f' }
    }
  },
  radii: {
    box: { value: '6px' }
  },
  durations: {
    skeleton: { value: '1.2s' },
    spin: { value: '1s' },
    fadeUp: { value: '200ms' },
    crossfade: { value: '160ms' }
  },
  fonts: {
    body: { value: 'sans-serif' }
  },
  lineHeights: {
    body: { value: '1.5' }
  }
}
```

- [ ] **Step 2: semantic token、keyframe、animation style を追加する**

semantic token には少なくとも `bg.canvas`、`bg.surface`、`fg.default`、`fg.muted`、`border.default`、`accent.solid`、`accent.subtle`、`danger.solid`、`surface.header`、`surface.rail`、`surface.tag`、`surface.error`、`overlay.backdrop`、`skeleton.start`、`skeleton.middle` を定義する。

`accent.subtle`、header、rail、backdrop、skeleton、tag、error は、旧 CSS と同一の `color-mix(in oklab, ...)` を token value に使う。近い preset color へ置換しない。

`skeletonPulse`、`fadeUp`、`crossfade` の keyframe は、旧 `pantry-skeleton-pulse`、`pantry-fade-up`、`pantry-crossfade` と同じ property/value を持たせる。`spin` は Panda preset を使う。animation style は次の名前で定義する。

```ts
animationStyles: {
  skeleton: {
    value: {
      animationName: 'skeletonPulse',
      animationDuration: 'skeleton',
      animationTimingFunction: 'ease-in-out',
      animationIterationCount: 'infinite'
    }
  },
  fadeUp: {
    value: {
      animationName: 'fadeUp',
      animationDuration: 'fadeUp',
      animationTimingFunction: 'ease-out',
      animationFillMode: 'both'
    }
  },
  crossfade: {
    value: {
      animationName: 'crossfade',
      animationDuration: 'crossfade',
      animationTimingFunction: 'ease-out',
      animationFillMode: 'both'
    }
  }
}
```

- [ ] **Step 3: `globalCss` に Kiso の実使用 reset を移す**

`defineGlobalStyles` を import し、Kiso のうち現在の UI が使う reset を Panda style object へ移す。対象は universal box sizing、root/body、heading/paragraph/list/definition list/link、embedded content/table、form control/fieldset/legend/placeholder/disabled、dialog/popover/hidden、focus-visible、reduced motion である。`preflight` は `false` のままにする。

```ts
const globalCss = defineGlobalStyles({
  body: {
    margin: 0,
    background: 'bg.canvas',
    color: 'fg.default'
  },
  ':focus-visible': {
    outline: '2px solid',
    outlineColor: 'accent.solid',
    outlineOffset: '2px'
  },
  '@media (prefers-reduced-motion: reduce)': {
    '*, *::before, *::after': {
      animationDuration: '0.01ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.01ms !important'
    }
  }
})
```

`globalCss` を `defineConfig()` に渡すが、この task では Kiso import と既存 body/focus/reduced-motion rule を削除しない。Kiso が最終比較基準として残っている間は、その rule が同じ結果を維持する。`:root` の `--pantry-*` と全旧 keyframe も残す。

次の表の selector と宣言を `globalCss` へ移す。これは Kiso を外した最終状態で必要になる baseline であり、`preflight: true` への置換はしない。

| Kiso の対象                                                                                    | Panda `globalCss` で維持する宣言                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `*, ::before, ::after`                                                                         | `boxSizing: 'border-box'`                                                                                                                                                                                                          |
| `:root`                                                                                        | `fontFamily: 'body'`、`lineHeight: 'body'`、`textSpacingTrim: 'trim-start'`、`textAutospace: 'normal'`、`lineBreak: 'strict'`、`overflowWrap: 'anywhere'`、text-size adjustment、`scrollbarGutter: 'stable'`、tap highlight の抑制 |
| `body`                                                                                         | `minBlockSize: '100dvb'`、`margin: 0`、Panda canvas 背景、標準文字色                                                                                                                                                               |
| `h1`、`h2`-`h6`、`p`、`blockquote`、`figure`、`pre`、`address`、`ul`、`ol`、`dl`、`menu`、`dd` | Kiso と同じ margin reset。`ul`/`ol`/`menu` は padding と marker も reset。`dt` は `fontWeight: 'bolder'`。                                                                                                                         |
| `a`                                                                                            | `color: 'inherit'`、`textDecorationLine: 'none'`、`textDecorationThickness: 'from-font'`、`textDecorationInset: 'auto'`                                                                                                            |
| `img`、`svg`、`picture`、`video`、`audio`、`canvas`、`model`、`iframe`、`embed`、`object`      | `maxInlineSize: '100%'`、`verticalAlign: 'bottom'`。audio 以外は `blockSize: 'auto'`、iframe は border reset。                                                                                                                     |
| `table`、`caption`、`th`                                                                       | `borderCollapse: 'collapse'` と text alignment reset。                                                                                                                                                                             |
| `button`、`input`、`select`、`textarea`、`::file-selector-button`                              | 1px solid border、border/color/font/letter spacing/text alignment の inherit/reset、button background reset、`touchAction: 'manipulation'`。                                                                                       |
| radio/checkbox/search/textarea/fieldset/legend/placeholder                                     | Kiso と同じ margin、appearance、resize、min inline size、border/padding、placeholder opacity の reset。                                                                                                                            |
| enabled/disabled controls                                                                      | enabled の `cursor: 'pointer'` と disabled の `cursor: 'default'`。                                                                                                                                                                |
| `dialog`、`[popover]`、`[hidden]`                                                              | Kiso と同じ overscroll、padding/border/margin/max-size、closed state、backdrop、hidden display の reset。                                                                                                                          |
| `:focus-visible` と reduced motion                                                             | 現行の 2px accent outline/2px offset と universal motion override。                                                                                                                                                                |

- [ ] **Step 4: codegen と layer の出力を確認する**

Run: `pnpm run panda:codegen && pnpm run typecheck && pnpm run build`

Expected: すべて成功する。生成された Panda CSS で global style が `@layer base`、atomic utility が `@layer utilities` にあることを確認する。

- [ ] **Step 5: Task 1 の screenshot と比較する**

body、form control、list/table、focus-visible、dialog の見た目が変わらないことを確認する。Kiso は残っているため、この段階で表示差分が出る場合は Panda global reset が既存 CSS を誤って上書きしている。

---

### Task 3: 共通 UI と motion を移す

**Files:**

- Create: `src/styles/ui.ts`
- Modify: `src/components/pantry-motion.tsx`
- Modify: `src/components/ui-state.tsx`
- Modify: `src/app.css`
- Reference: `src/app.css` の `.pantry-box`、`.pantry-skeleton`、`.pantry-empty`、`.pantry-error`、`.pantry-sr-only`、`.pantry-button*`、`.pantry-text-link`、`.pantry-flash`、`.pantry-form-summary`、`.pantry-field*`、`.pantry-motion-*`

- [ ] **Step 1: `src/styles/ui.ts` に共有 contract を定義する**

`css`、`cva`、`visuallyHidden` を `styled-system` から import する。pattern の import は `visuallyHiddenPattern` へ alias する。次だけを export する。

```ts
export const surface = css({
  borderWidth: '1px',
  borderColor: 'border.default',
  borderRadius: 'box',
  background: 'bg.surface'
})

export const srOnly = css(visuallyHiddenPattern())
```

同じファイルに、44px の block size、inline-flex、font inherit、disabled state を base に持つ `button` recipe と、通常/label/link の差だけを variant に持つ `tagChip` recipe を定義する。accent、danger、pressed、disabled の色は Task 2 の semantic token を使う。

- [ ] **Step 2: `UiLoading`、`UiEmpty`、`UiError` を移す**

`src/components/ui-state.tsx` で `.pantry-skeleton`、`.pantry-spinner`、`.pantry-empty`、`.pantry-error` をすべて Panda class に置換する。`UiError` の paragraph と retry button に個別 class を渡し、旧 descendant selector を持ち込まない。

spinner は `animation: 'spin 1s linear infinite'`、skeleton は `animationStyle: 'skeleton'` を使う。retry button は shared `button` の accent variant を使う。

- [ ] **Step 3: `PantryMotion` を Panda animation style に置換する**

`kindClassName` を `fadeUp` / `crossfade` の Panda class map に置き換える。各 class には `_motionReduce: { animation: 'none !important' }` を含め、旧 `.pantry-motion-*` の reduced-motion 規則と同じ結果にする。外から受け取る `className` は `cx()` で結合する。

- [ ] **Step 4: app.css から移行済み selector を削除する**

削除対象は `.pantry-spinner`、`.pantry-empty`、`.pantry-error`、`.pantry-motion-*` と対応 keyframe だけである。`.pantry-skeleton` は detail/tag table skeleton が、`.pantry-sr-only`、`.pantry-button*`、`.pantry-text-link`、`.pantry-flash`、`.pantry-form-summary`、`.pantry-field*` は未移行の画面がまだ使うため残す。

- [ ] **Step 5: 状態表示を検証する**

Run: `pnpm run panda:codegen && pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build`

Expected: すべて成功する。Playwright で loading/error、retry button、keyboard focus、通常/reduced motion を比較する。

---

### Task 4: タグ機能とサインインを移す

**Files:**

- Modify: `src/routes/sign-in/index.tsx`
- Modify: `src/routes/sign-in/-components/sign-in-with-email-and-password-form.tsx`
- Modify: `src/features/tags/components/entrance-boxes.tsx`
- Modify: `src/features/tags/components/shelf-nav.tsx`
- Modify: `src/features/tags/components/inline-add-tag.tsx`
- Modify: `src/features/tags/components/tag-edit-fields.tsx`
- Modify: `src/features/tags/tag-table.tsx`
- Modify: `src/routes/_protected/tags/index.tsx`
- Modify: `src/routes/_protected/tags/new.tsx`
- Modify: `src/routes/_protected/tags/$id.edit.tsx`
- Modify: `src/routes/_protected/tags/$id/index.tsx`
- Modify: `src/app.css`

- [ ] **Step 1: サインインと玄関を移す**

sign-in の full-height grid、radial gradient、panel、brand、tagline、form margin を Panda class に置換する。`EntranceBoxes` の grid、surface card、stripe、ellipsis、count、empty action を置換する。`40rem` の card grid 切替は Panda `sm` condition で再現する。

stripe の `tag.color` は `style={{ backgroundColor: tag.color }}` のまま残す。色がない場合は Panda class の line color が見えることを確認する。

- [ ] **Step 2: shelf nav とタグ table を移す**

`ShelfNav` の column layout、item の 44px height、selected border/background、dot、ellipsis、count を Panda class に置換する。`data-selected` は残し、`_selected` condition を使う。

`tag-table.tsx` の table/cell/header/name/count/muted と skeleton size を対象要素に直接適用する。tag dot の runtime `backgroundColor` は残す。

- [ ] **Step 3: タグ form と detail を移す**

`TagEditFields` の palette、clear swatch、pressed ring、sort-order input、disabled state を移す。clear swatch の diagonal gradient は旧 rule と同じ値を Panda の background image に使う。

選択済み swatch の `Check` は `color='#fff'` prop を外し、Panda class で `fg` を surface token にする。palette の `backgroundColor` だけは runtime value として残す。

new/edit の workbench、fieldset、summary、error、actions を shared primitive と page-local class へ置換する。tag detail の header、meta definition list、flash、actions を移す。

- [ ] **Step 4: tag/sigin 用の旧 selector を削除する**

`app.css` から `.pantry-sign-in*`、`.pantry-entrance*`、`.pantry-shelf-nav`、`.pantry-shelf-item*`、`.pantry-shelf-dot*`、`.pantry-inline-add-tag`、`.pantry-color-*`、`.pantry-sort-order`、`.pantry-tag-admin*`、`.pantry-tag-table*`、`.pantry-tag-detail*` のうち本 task で完全に移行済みの rule を削除する。`.pantry-workbench*`、`.pantry-field*`、`.pantry-form-summary`、`.pantry-button*`、`.pantry-text-link`、`.pantry-sr-only` は bookmark/settings がまだ使うため残す。

- [ ] **Step 5: mobile/desktop と動的タグ色を検証する**

Run: `pnpm run panda:codegen && pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build`

Expected: すべて成功する。375px と 1280px で entrance/shelf/tag admin を比較し、色あり/なし、pin toggle、palette pressed state、field error、disabled submit を確認する。

---

### Task 5: ブックマーク一覧を移す

**Files:**

- Modify: `src/features/bookmarks/components/bookmark-list.tsx`
- Modify: `src/features/bookmarks/components/bookmark-table.tsx`
- Modify: `src/app.css`

- [ ] **Step 1: toolbar の各要素へ style を移す**

`ListToolbar` の section、title row、new link、search form/input/button、control row、fieldset button group、select label/select、selected tag list、tag add select を個別の Panda class に置換する。

`button[aria-pressed='true']` は `_pressed` condition に移す。input/select は shared form control を使い、search input の `flex: 1` と `min-inline-size: 12rem`、control の wrap/gap を保持する。

- [ ] **Step 2: card/list loading を移す**

cards の 1-column grid と `sm` での 2-column grid、surface card の column layout、title/url/note clamp、tag list、loading stack、load-more area/button を移す。note の `-webkit-line-clamp: 2` と card 内 tag list の top margin を落とさない。

- [ ] **Step 3: table を移す**

table、header/cell border/padding/alignment、row link、muted link、empty tag text を Panda class に置換する。table semantics は保ち、`th`/`td` へ同じ class を明示的に渡す。

- [ ] **Step 4: 一覧用 selector を削除して検証する**

`.pantry-list-toolbar*`、`.pantry-bookmark-cards`、`.pantry-bookmark-card*`、`.pantry-bookmark-tags*`、`.pantry-bookmark-table*`、`.pantry-bookmark-row-link*`、`.pantry-bookmark-list__partial`、`.pantry-load-more` を削除する。

Run: `pnpm run panda:codegen && pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build`

Expected: すべて成功する。639px/640px で grid 切替、AND/OR と layout toggle の pressed state、load-more disabled、table/card crossfade を比較する。

---

### Task 6: ブックマーク detail と workbench を移す

**Files:**

- Modify: `src/routes/_protected/bookmarks/-components/bookmark-workbench-form.tsx`
- Modify: `src/routes/_protected/bookmarks/new/index.tsx`
- Modify: `src/routes/_protected/bookmarks/$id/edit.tsx`
- Modify: `src/routes/_protected/bookmarks/$id/index.tsx`
- Modify: `src/app.css`

- [ ] **Step 1: workbench form を移す**

workbench max width/stack/nav/title/lead、form fieldset、URL row、summary、error、actions を Panda class に置換する。URL row の first control は `flex: 1` と `min-inline-size: 12rem` を持たせ、title fetch button と保存 button の busy/disabled state を保持する。

- [ ] **Step 2: detail と skeleton を移す**

detail max width/stack/nav/header/title/url/note/tag list/meta/date definition list/actions を置換する。URL の `word-break: break-all`、note の `white-space: pre-wrap` と `line-height: 1.7`、日時の tabular number を維持する。

skeleton block/line の各 modifier は、用途ごとの Panda class として残す。nav、title、url、tags、action、note、dates の inline/block size が基準 screenshot と一致することを確認する。

- [ ] **Step 3: delete dialog を移す**

backdrop、dialog surface、title、action row を Panda class に置換する。`Dialog.Backdrop`、`Dialog.Popup`、`Dialog.Title` の component API と role/focus management は変えない。

- [ ] **Step 4: detail/workbench selector を削除して検証する**

`.pantry-detail*`、`.pantry-workbench*`、`.pantry-workbench-form*`、`.pantry-dialog*`、`.pantry-field*`、`.pantry-form-summary`、`.pantry-tag-chip*` と残る `.pantry-skeleton` modifier を削除する。`.pantry-button*`、`.pantry-text-link`、`.pantry-flash`、`.pantry-sr-only` は settings と app frame がまだ使うため残す。

Run: `pnpm run panda:codegen && pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build`

Expected: すべて成功する。新規登録、タイトル取得失敗、validation error、編集、flash、削除 dialog、detail skeleton を mobile/desktop で確認する。

---

### Task 7: アプリ frame、settings、Panda-only への最終切替を行う

**Files:**

- Modify: `src/routes/_protected.tsx`
- Modify: `src/routes/_protected/settings/index.tsx`
- Modify: `src/routes/__root.tsx`
- Modify: `src/index.css`
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Delete: `src/app.css`

- [ ] **Step 1: protected layout を移す**

shell の mobile one-column grid と `md` の `16rem minmax(0, 1fr)` grid、rail、content、header、brand、actions、main を Panda class に置換する。

mobile shelf sheet の backdrop、popup、header、title、close button を移す。`md` では rail を表示し、mobile brand と shelf changer を非表示にする既存条件を Panda `md` condition で再現する。

- [ ] **Step 2: settings を移す**

settings max width/stack/title/lead/section/heading/account definition list と sign-out button の disabled state を Panda class に置換する。

- [ ] **Step 3: Panda-only の CSS entry へ切り替える**

`.pantry-shell*`、`.pantry-shelf-rail*`、`.pantry-shelf-sheet*`、`.pantry-shell-header*`、`.pantry-brand*`、`.pantry-sign-out`、`.pantry-settings*`、`.pantry-box`、`.pantry-button*`、`.pantry-text-link`、`.pantry-flash`、`.pantry-sr-only` と残る media query を削除する。

`src/app.css` に残る `:root` の `--pantry-*`、旧 `@keyframes`、Kiso import、application selector をすべて削除してファイル自体を削除する。`src/routes/__root.tsx` の import は `../app.css` から `../index.css` へ変更する。`src/index.css` は Panda layer 順序だけを残す。

```css
@layer reset, base, tokens, recipes, utilities;
```

`package.json` の `kiso.css` dependency と `pnpm-workspace.yaml` の catalog entry を削除し、`pnpm install --lockfile-only` で lockfile からも除去する。

- [ ] **Step 4: migration boundary を検査する**

Run: `rg -n 'pantry-' src`

Expected: 出力なし。`PantryMotion` の型名など大文字の識別子は対象外である。

Run: `test ! -e src/app.css`

Expected: 成功し、app.css が存在しない。

Run: `! rg -n 'kiso\.css' package.json pnpm-workspace.yaml pnpm-lock.yaml src`

Expected: 成功し、Kiso dependency/source import が存在しない。

Run: `rg -n 'style=\{\{' src`

Expected: `backgroundColor` を runtime tag color に渡す 5 箇所だけが残る。`src/features/tags/tag-table.tsx`、`src/features/tags/components/entrance-boxes.tsx`、`src/routes/_protected/tags/$id/index.tsx`、`src/features/tags/components/tag-edit-fields.tsx`、`src/features/tags/components/shelf-nav.tsx` を確認する。

- [ ] **Step 5: 全体を検証する**

Run: `pnpm run panda:codegen && pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build`

Expected: すべて成功する。Task 1 の全 screenshot を比較し、差分がないことを確認する。

---

## 実装後の確認

- Panda MCP の semantic token、recipe、animation style の一覧に Pantry 固有の定義が出ることを確認する。
- Panda MCP の conditions で `sm` / `md`、`_selected`、`_pressed`、`_disabled`、`_motionReduce` が使用可能なままであることを確認する。
- `styled-system/` は生成物のままであり、git 管理対象に追加しない。
- 画面差分が出た場合、次 task へ進まない。最初に token、次に該当 component の Panda class、最後に cascade layer の順で確認する。
