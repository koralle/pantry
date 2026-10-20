import { createOxlintConfig } from "@pantry/forge/oxlint";

// リポジトリ全体に効く設定は @pantry/forge/oxlint が持つ。
// ここにはルート固有の差分だけを置く。
// 注意: apps/web 配下は apps/web/oxlint.config.ts がこの設定を置き換える（ネスト設定は親とマージされない）。
// apps/web にも効かせたい設定はここではなく @pantry/forge/oxlint に置くこと。
export default createOxlintConfig();
