import { defineConfig } from "oxlint";
import type { OxlintConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import vitest from "ultracite/oxlint/vitest";

/**
 * Oxlint は `extends` した設定の `ignorePatterns` を継承しない。
 * そのため `createOxlintConfig` がこの配列を必ず設定に含める。
 *
 * パターンは設定ファイルの位置に依存しない glob で定義する。
 */
const ignorePatterns = [
  ...(core.ignorePatterns ?? []),
  "**/.agents/skills/**",
  "**/.pnpmfile.cjs",
  "**/tanstack-entry-stub.ts",
];

/**
 * テスト・メンテナンススクリプト向けの緩和。`extends` する側のディレクトリに
 * 依存しない glob にする。
 */
const testFiles = [
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.spec.ts",
  "**/*.spec.tsx",
  "**/test-helpers.ts",
  "**/*.test-helpers.ts",
  "**/*.test-utils.ts",
  "**/test-deps.ts",
  "**/__mocks__/**/*.ts",
  "**/src/test/**/*.ts",
  "**/src/test/**/*.tsx",
  "**/scripts/**/*.ts",
];

const oxlintConfig = defineConfig({
  // react / tanstack は apps/web/oxlint.config.ts が受け持つ（React を使うのは web だけ）。
  extends: [core],
  overrides: [
    {
      files: testFiles,
      rules: {
        "func-style": "off",
        "no-await-in-loop": "off",
        "no-promise-executor-return": "off",
        "no-use-before-define": "off",
        "no-useless-return": "off",
        "promise/avoid-new": "off",
        // テストダブルは本物の port が async である以上 async になるが、本文に await は無い。
        "require-await": "off",
        "typescript/await-thenable": "off",
        "typescript/consistent-type-imports": "off",
        "typescript/no-base-to-string": "off",
        "typescript/no-explicit-any": "off",
        "typescript/no-unsafe-argument": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-call": "off",
        "typescript/no-unsafe-member-access": "off",
        "typescript/no-unsafe-return": "off",
        "typescript/no-unsafe-type-assertion": "off",
        "typescript/strict-void-return": "off",
        "unicorn/import-style": "off",
        "unicorn/no-immediate-mutation": "off",
        "unicorn/no-await-expression-member": "off",
      },
    },
    {
      // stories はテスト fixture と同じ扱い。prod のコードでは unsafe 系を有効に保つ。
      files: ["**/*.stories.{ts,tsx}"],
      rules: {
        "typescript/no-unsafe-argument": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-call": "off",
        "typescript/no-unsafe-member-access": "off",
        "typescript/no-unsafe-return": "off",
        "typescript/no-unsafe-type-assertion": "off",
      },
    },
  ],
  rules: {
    // コールバックを Promise へ書き換える前提のルール。TanStack Query の
    // コールバック API と Better Auth のフックは callback 前提で、書き換えると
    // 呼び出し側の設計が変わるため無効。
    "promise/prefer-await-to-callbacks": "off",
    // 真偽値の明示は型で担保する方針（`strict` + `noUncheckedIndexedAccess`）。
    // 有効にすると 30 件超の `!value` を書き換える必要があり、可読性も落ちる。
    "typescript/strict-boolean-expressions": "off",
  },
});

type CreateOxlintConfigOptions = Omit<OxlintConfig, "ignorePatterns"> & {
  /** リポジトリ固有で追加したい ignore。共通の ignore の後ろに連結される。 */
  ignorePatterns?: string[];
};

/**
 * パッケージごとの設定を作る。`extends` と共通 `ignorePatterns` を必ず含むため、
 * 呼び出し側は差分だけを渡せばよい（`ignorePatterns` の再宣言漏れを防ぐ）。
 * `extends` を渡すと、共通設定の後ろに連結される（opt-in のプリセットを足す用途）。
 *
 * 注意: 返した設定はネスト設定として親設定を置き換える。
 * 全パッケージに効かせたい設定はここ（forge）に置くこと。
 */
export const createOxlintConfig = ({
  extends: presets = [],
  ignorePatterns: additionalIgnorePatterns = [],
  ...rest
}: CreateOxlintConfigOptions = {}) =>
  defineConfig({
    extends: [oxlintConfig, ...presets],
    ignorePatterns: [...ignorePatterns, ...additionalIgnorePatterns],
    ...rest,
  });

/**
 * `ultracite/oxlint/vitest` はルールを `overrides` で一括有効化するため、
 * `extends` する側からは個別ルールを上書きできない（プリセットの `overrides` が必ず勝つ）。
 * このリポジトリの規約と衝突するものだけを差し替えたプリセットを渡す。
 *
 * - `consistent-test-it`: 既定は `describe` 内で `it` を推奨するが、このリポジトリは `test` 固定。
 * - `prefer-import-in-mock`: 自動修正が `vi.mock(import("..."))` へ書き換えるが、これは
 *   型付き overload になるため部分的な module mock が型検査を通らなくなる。
 * - `prefer-to-be-truthy` / `prefer-to-be-falsy`: `toBe(true)` / `toBe(false)` を
 *   truthy へ丸めさせると、boolean を返す契約（API の応答、判定関数）が
 *   別の truthy 値に変わっても緑のままになる。
 */
export const vitestPreset: OxlintConfig = {
  overrides: (vitest.overrides ?? []).map((override) => ({
    ...override,
    rules: {
      ...override.rules,
      "vitest/consistent-test-it": [
        "error",
        { fn: "test", withinDescribe: "test" },
      ],
      "vitest/prefer-import-in-mock": "off",
      "vitest/prefer-to-be-falsy": "off",
      "vitest/prefer-to-be-truthy": "off",
    },
  })),
};
