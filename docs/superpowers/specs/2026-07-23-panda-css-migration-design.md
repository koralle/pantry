# app.css の Panda CSS 段階移行

## Goal

- Panda CSS を、アプリケーション固有の静的 style と global reset の唯一の所有者にする。
- `src/app.css` を削除し、`src/index.css` を Panda layer 順序だけを持つ global entry として `src/routes/__root.tsx` から直接 import する。
- `kiso.css` を dependency、workspace catalog、lockfile、source import のすべてから削除する。
- `preflight: false` を維持し、現在の UI が Kiso から受け取る document、list、table、form、dialog、focus の reset を Panda `globalCss` に移す。
- `src` から `.pantry-*` class と static inline style をなくす。DB 由来の `tag.color` と palette value の `backgroundColor` だけは runtime value として残す。
- 表示、レスポンシブ境界、focus、motion、キーボード操作、Base UI Dialog の挙動を現状と一致させる。UI の再設計は行わない。

## Constraints and Decisions

| 項目           | 決定                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 移行の単位     | 画面または共有コンポーネント単位。移行済み要素に旧 class と Panda class を併用しない。                                                            |
| 表示仕様       | 現行の表示・挙動を完全に維持する。UI 改善は別タスクにする。                                                                                       |
| Panda API      | 構造スタイルは `css()`、実際に variant を持つ共有 UI だけ `cva()`。`styled` と JSX primitive への一括置換はしない。                               |
| 型安全性       | `strictTokens` と `strictPropertyValues` を維持する。静的な値は custom token または preset token を使う。                                         |
| グローバル CSS | `preflight: false` を維持する。Kiso が現在担う document、list、table、form、dialog、focus の reset を Panda `globalCss` へ移す。                  |
| CSS entry      | `src/index.css` を Panda layer 順序だけを持つ global entry とし、`src/routes/__root.tsx` から直接 import する。`src/app.css` は最終的に削除する。 |
| 動的なタグ色   | DB の `tag.color` は実行時値なので inline `backgroundColor` を明示的な例外として残す。                                                            |
| 生成物         | `styled-system/` は `pnpm run panda:codegen` で生成し、手編集しない。                                                                             |
| 移行中の互換性 | 未移行の selector が参照する `--pantry-*` variable と旧 keyframe は最終 purge まで残す。Panda theme を新規コードの唯一の参照先にする。            |

## Current State

- Panda CSS 1.11.4 は PostCSS 経由で導入済みで、`src/**/*.{ts,tsx}` が extraction 対象である。
- `panda.config.ts` は strict validation が有効だが、プロジェクト固有の token、semantic token、recipe、keyframe をまだ持たない。
- 現行 CSS のブレークポイントは `40rem` と `48rem` で、Panda の `sm` と `md` に一致する。
- Panda preset には `spin` keyframe がある。既存の spinner はこれを再利用し、skeleton、fade-up、crossfade だけを project keyframe として追加する。
- `--duration-enter` と `--duration-exit` は `app.css` 外からも CSS 内からも参照されないため移行しない。
- `kiso.css` 1.2.4 は box sizing、document/body、list、table、form、dialog、focus、hidden state の reset を提供している。外部 reset を残さず、同じ適用範囲を Panda `globalCss` へ明示的に移す。

## Target Styling Architecture

### Theme

`panda.config.ts` に現行の値から次の階層を定義する。

| 階層                  | 用途                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| literal tokens        | Pantry の background、ink、muted、line、accent、white、danger、box radius、body font、body line height                        |
| semantic tokens       | canvas/surface 背景、default/muted foreground、default/accent/error border、accent/error surface、backdrop、skeleton gradient |
| animation definitions | `skeletonPulse`、`fadeUp`、`crossfade` と対応する animation style                                                             |

既存の `color-mix(in oklab, ...)` は semantic token の値としてそのまま保持する。header、rail、backdrop、skeleton、chip、form summary、flash、sign-in gradient の色を近似色へ置き換えない。

### Style Ownership

- `src/styles/ui.ts` に、複数の機能で再利用する static class と `cva()` を集める。
- `button` は default、accent、danger の visual variant を持つ recipe にする。
- `tagChip` は interactive label/link の visual variant を持つ recipe にする。
- surface、form control、visually-hidden は variant を持たない static Panda class にする。
- 各ページ・機能に固有の grid、stack、table、dialog、header、detail layout は対応する `.tsx` 内に top-level の `css()` class として置く。
- native element の descendant selector は廃止し、input、select、button、label 自身へ class を渡す。
- TanStack `Link`、Base UI `Dialog`、意味論的 HTML、既存の data/ARIA state は変更しない。`_selected`、`_pressed`、`_disabled`、`_motionReduce` など Panda condition をそのまま使う。

### Global Styles

`globalCss` は、現在の実 UI が Kiso から受け取る基準を Panda 内で定義する。

- universal box sizing、root typography、viewport/body の min block size と canvas 背景。
- heading、paragraph、list、definition list、link、embedded content、table の UA reset。
- button/input/select/textarea、fieldset/legend、placeholder、disabled state の form reset。
- dialog/popover、`hidden`、`:focus-visible` の状態 reset と、現行と同じ reduced-motion 規則。

`src/index.css` は `@layer reset, base, tokens, recipes, utilities;` だけを持つ global entry にする。`src/routes/__root.tsx` はこれを直接 import する。Panda の global style は base layer、atomic style は utilities layer に出力されるため、アプリ固有の raw CSS は残さない。

現行の全体 reduced-motion 規則は現代の CSS 指針より広すぎるが、移行中に挙動を変えないため同じ意味で残す。コンポーネントごとの reduced-motion 仕様への改善は、本移行の完了後に別途扱う。

theme 追加時には、まだ `--pantry-*` variable と旧 keyframe を削除しない。これらは未移行の CSS selector が参照しているためである。移行済みコンポーネントは Panda token と animation style だけを参照し、旧定義と Kiso 依存は Wave 6 で最後の selector とともに削除する。

## Migration Waves

| Wave | 対象                              | 主なファイル                                                                          | 完了時に app.css から削除する範囲                                                                                                 |
| ---- | --------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 0    | 比較基準                          | 変更なし                                                                              | 主要画面の mobile、640px 境界、768px 境界、desktop の screenshot を取得する。                                                     |
| 1    | Theme と global styles            | `panda.config.ts`、`src/app.css`                                                      | Panda theme と、Kiso と同じ適用範囲の global reset を追加する。legacy root variable、keyframe、Kiso import は比較基準として残す。 |
| 2    | 共有 state/motion と UI primitive | `src/components/pantry-motion.tsx`、`src/components/ui-state.tsx`、`src/styles/ui.ts` | skeleton、spinner、empty/error、button、tag chip、form control、screen-reader-only。                                              |
| 3    | 認証・タグ機能                    | `src/routes/sign-in/**`、`src/features/tags/**`、`src/routes/_protected/tags/**`      | entrance、shelf nav、tag table、tag form、palette、tag detail/admin。                                                             |
| 4    | ブックマーク機能                  | `src/features/bookmarks/components/**`、`src/routes/_protected/bookmarks/**`          | list toolbar、table/card、detail、workbench form、dialog。                                                                        |
| 5    | アプリケーション frame と設定     | `src/routes/_protected.tsx`、`src/routes/_protected/settings/index.tsx`               | shell、rail、header、mobile shelf sheet、settings。                                                                               |
| 6    | purge                             | `src/app.css`、`src/index.css`、`src/routes/__root.tsx`、依存設定、全 `src/**/*.tsx`  | 残る `.pantry-*` セレクタと class usage、Kiso 依存をすべて除去し、app.css を削除する。                                            |

Wave 2 以降は、対象コンポーネントを Panda class へ完全に置換してから、対応する CSS ルールを同じ変更で削除する。旧 CSS が未移行コンポーネントを支える期間は許容するが、移行済み要素を旧 class へ依存させない。

## Verification

各 wave で次を行う。

1. 対象画面を基準 screenshot と比較し、色、spacing、border、radius、typography、レスポンシブ切替を一致させる。
2. キーボード focus、44px 操作領域、`aria-pressed` / `data-selected` / disabled state、dialog、loading/error state を実ブラウザで確認する。
3. tag color が設定済みと未設定の両方で正しく表示されることを確認する。
4. `prefers-reduced-motion: reduce` で現在と同じ挙動になることを確認する。
5. `pnpm run panda:codegen`、`pnpm run format:check`、`pnpm run lint`、`pnpm run typecheck`、`pnpm run test`、`pnpm run build` を実行する。

最終 wave では、`rg 'pantry-' src` がゼロ件であること、`src/app.css` が存在しないこと、Kiso が dependency/lockfile/source に残らないこと、動的 tag color 以外の static inline style が残っていないことを確認する。

## Rollback and Scope Control

- 各 wave は単独で revert 可能な変更単位とする。視覚差分が出た場合は、次 wave へ進まずその wave 内で token または component class を修正する。
- テーマ変更、dark mode、フォーム外観の再設計、reduced-motion の仕様改善、container query への置換は本移行に含めない。
- `src/styles/ui.ts` へ新しい共有 abstraction を追加するのは、少なくとも二つの機能が同じ visual contract を使う場合だけにする。
