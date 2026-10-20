import { ignorePatterns, oxlintConfig } from "@pantry/forge/oxlint";
import { defineConfig } from "oxlint";

// リポジトリ全体に効く設定は @pantry/forge/oxlint が持つ。
// ここにはルート固有の差分だけを置く。
export default defineConfig({
  extends: [oxlintConfig],
  ignorePatterns,
});
