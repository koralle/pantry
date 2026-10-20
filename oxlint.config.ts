import base, { ignorePatterns } from "@pantry/oxlint";
import { defineConfig } from "oxlint";

// リポジトリ全体に効く設定は @pantry/oxlint が持つ。
// ここにはルート固有の差分だけを置く。
export default defineConfig({
  extends: [base],
  ignorePatterns,
});
