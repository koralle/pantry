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
  // oxlint 側（apps/web/oxlint.config.ts）の同じ除外と対応させる。
  ignore: {
    overrides: [
      {
        // renderToString の描画中に hook の戻り値を受け取るテストハーネス。
        files: [
          "src/features/auth/hooks/use-email-sign-in.test.tsx",
          "src/features/auth/hooks/use-passkey-sign-in.test.tsx",
        ],
        rules: ["react-doctor/no-prop-callback-in-render"],
      },
      {
        // QuickAddRound は 300 行超で分岐も多い。分割は別作業として切り出す。
        files: ["src/features/bookmarks/components/quick-add/index.tsx"],
        rules: [
          "react-doctor/no-giant-component",
          "react-doctor/no-high-complexity-react-function",
        ],
      },
    ],
  },
  blocking: "warning",
  // 既定は 50。依存の供給網・脆弱性スコアが 80 未満なら error にする。
  supplyChain: { minScore: 80 },
  // 既定ではテストと story の指摘は合否から外れる。厳し目なので含める。
  surfaces: {
    ciFailure: { includeFileContexts: ["test", "story"] },
  },
});
