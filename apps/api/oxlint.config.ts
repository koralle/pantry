import { createOxlintConfig, vitestPreset } from "@pantry/forge/oxlint";
import landmines from "ultracite/oxlint/landmines";

// リポジトリ全体に効く設定は @pantry/forge/oxlint が持つ。
// このファイルを置いた時点で apps/api 配下はルート oxlint.config.ts の対象外になる
// （Oxlint はファイルごとに最も近い設定だけを使い、親設定とはマージしない）。
// landmines は「エージェントが green にするための近道」を止める opt-in プリセット。
export default createOxlintConfig({
  extends: [landmines, vitestPreset],
  jsPlugins: landmines.jsPlugins,
  rules: {
    // コメントは「なぜ」を残す規約（.agents/rules/ultracite.md）。差分を語るコメントの検出は要らない。
    "landmines-style/no-comments": "off",
    // 戻り値型は procedure / port の契約として明示する規約。
    "landmines-types/no-explicit-return-types": "off",
    // vi.fn での依存差し替えを前提にしたテストが残っている。MSW へ寄せるのは別作業。
    "landmines-testing/no-test-doubles": "off",
    // DB Integration の待ちは Testcontainers の起動待ちで、テストの遅さを隠すためではない。
    "landmines-testing/no-flake-masking": [
      "error",
      { allow: { "apps/api/vitest.config.ts": 2 } },
    ],
  },
  overrides: [
    {
      // Integration test は複数モジュールにまたがるため、実装 owner を 1 つに決められない。
      files: ["**/*.integration.test.ts"],
      rules: { "landmines-structure/colocated-tests": "off" },
    },
  ],
});
