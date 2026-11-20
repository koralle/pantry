import { reactDoctorExemptions } from "@pantry/forge/react-doctor";
import { defineConfig } from "react-doctor/api";

// React を使うのは apps/web だけなので、ルートの設定からその 1 つを指す。
// 厳し目: 既定では warning どまりの診断も error に引き上げ、警告でも exit 1 にする。
export default defineConfig({
  rootDir: "apps/web",
  categories: {
    Accessibility: "error",
    Bugs: "error",
    Maintainability: "error",
    Performance: "error",
    Security: "error",
  },
  // 依存グラフ全体を見るルール（unused-export / unused-dependency / circular-dependency など）は
  // 明示しないと走らない。同じ観点は knip が CI と pre-push で見ているので、ここでは有効にしない。
  // React Compiler を検出すると冗長な memo 化は warning へ落とされる。それも error のままにする。
  buckets: { "compiler-cleanup": "error" },
  // 除外の正本は @pantry/forge/react-doctor（apps/web の oxlint 設定も同じものを読む）。
  ignore: {
    overrides: reactDoctorExemptions.map(({ files, rules }) => ({
      files: [...files],
      rules: [...rules],
    })),
  },
  // スコア API へ診断（ファイルパスと指摘文）を送らない。CI でも同じ設定で走らせる。
  noScore: true,
  blocking: "warning",
  // 既定は 50。依存の供給網・脆弱性スコアが 80 未満なら error にする。
  supplyChain: { minScore: 80 },
  // 既定ではテストと story の指摘は合否から外れる。厳し目なので合否判定に含める。
  surfaces: {
    ciFailure: { includeFileContexts: ["test", "story"] },
  },
});
