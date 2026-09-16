# panda.config.ts を責務別に分割し、codegen 入力を panda/ に置く

UIUX 改修の第一歩として、panda.config.ts に集中していたスタイル定義を物理分割する。Panda の codegen への入力（globalCss・トークン・セマンティックトークン・keyframes・animationStyles）はリポジトリルートの `panda/` に置き、`styled-system` 生成物を利用する `css()`/`cva()` は従来どおり `src/styles/` を含む `src/` に置く。`panda.config.ts` は include/outdir 等の配管と、`panda/` 配下のモジュールを `theme.extend` へ組み立てる役だけを持つ。

**Status:** accepted

## Considered Options

- **`src/styles/` に同居** — 既存ディレクトリだが、生成物の consumer と codegen 入力が混ざり依存方向が曖昧になる。却下。
- **`src/theme/`** — src 内に置くとアプリコードと codegen 入力の境界が引けない。却下。
- **`definePreset` で自己完結** — globalCss ごと preset にできるが、他から再利用しない theme を preset 化する間接層は不要。素の export を config が組み立てる形にした。
- **粗粒度（global-css + theme の2ファイル）** — theme.ts が再び巨大化する。却下。
- **Panda カテゴリ忠実（1カテゴリ1ファイル）** — easings や shadows のような数行ファイルが量産される。デザイン上の関心事で集約した。

## Consequences

- ファイル構成はデザイン関心事別の8ファイル: `global-css` / `colors`（primitive パレット）/ `semantic-colors` / `typography`（fonts + fontSizes + lineHeights）/ `sizes` / `shape`（radii + borderWidths）/ `shadows` / `motion`（durations + easings + keyframes + animationStyles）。
- 各ファイルは `defineTokens` / `defineSemanticTokens` / `defineKeyframes` / `defineAnimationStyles` / `defineGlobalStyles` で包んだ部分マップを export し、config が spread で `theme.extend` に組み立てる。`panda/index.ts` のような barrel は作らず、config が各ファイルを直接 import する。
- `panda/` 配下は `styled-system` を import しない。codegen の入力が生成物に依存すると循環になるため。依存方向は常に `panda/`（入力）→ `styled-system`（生成物）→ `src/`（consumer）。
- トークンの名前と値は一切変更しない（移動のみ）。`md2`/`xs2` やリテラル名の sizes 等の体系整理は今回の対象外であり、将来の課題として残る。
- semantic colors を独立ファイルにしたことで、将来 dark mode 等の条件付き値を足す拡張点が確保された。
- `src/stories/theme/token-data.ts` は `panda/` ソースを walk してプロジェクト定義トークンを派生させ、手動ミラーをやめる。Panda デフォルトトークン分は静的リストを維持する（生成物 `styled-system/tokens` は列挙可能なマップを export していないため）。
- Storybook カタログの表示順は `panda/` ソースのキー定義順に従う。キーはアルファベットではなくデザイン上の論理順（サイズ昇順等）で並べる。
