import { defineConfig } from "oxlint";
import type { OxlintConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import tanstack from "ultracite/oxlint/tanstack";

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
  "**/postcss.config.cjs",
  "**/tanstack-entry-stub.ts",
];

const oxlintConfig = defineConfig({
  extends: [core, react, tanstack],
  overrides: [
    {
      // テスト・メンテナンススクリプト向けの緩和。
      // `extends` する側のディレクトリに依存しない glob にする。
      files: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "**/test-helpers.ts",
        "**/*.test-helpers.ts",
        "**/__mocks__/**/*.ts",
        "**/src/test/**/*.ts",
        "**/src/test/**/*.tsx",
        "**/scripts/**/*.ts",
      ],
      rules: {
        "func-style": "off",
        "no-await-in-loop": "off",
        "no-promise-executor-return": "off",
        "no-use-before-define": "off",
        "no-useless-return": "off",
        "promise/avoid-new": "off",
        "require-await": "off",
        "require-unicode-regexp": "off",
        "sort-keys": "off",
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
      },
    },
  ],
  rules: {
    complexity: "off",
    "default-case": "off",
    eqeqeq: "off",
    "import/first": "off",
    "no-empty-function": "off",
    "no-eq-null": "off",
    "no-use-before-define": "off",
    "prefer-destructuring": "off",
    "promise/prefer-await-to-callbacks": "off",
    "promise/prefer-await-to-then": "off",
    "react-hooks/rules-of-hooks": "off",
    "react/exhaustive-effect-dependencies": "off",
    "react/hooks": "off",
    "react/refs": "off",
    "react/set-state-in-effect": "off",
    "react/todo": "off",
    "require-await": "off",
    "require-unicode-regexp": "off",
    "sort-keys": "off",
    "typescript/consistent-return": "off",
    "typescript/no-deprecated": "off",
    "typescript/no-misused-promises": "off",
    "typescript/no-non-null-assertion": "off",
    "typescript/no-unsafe-argument": "off",
    "typescript/no-unsafe-assignment": "off",
    "typescript/no-unsafe-call": "off",
    "typescript/no-unsafe-member-access": "off",
    "typescript/no-unsafe-return": "off",
    "typescript/no-unsafe-type-assertion": "off",
    "typescript/only-throw-error": "off",
    "typescript/strict-boolean-expressions": "off",
    "typescript/strict-void-return": "off",
    "unicorn/no-await-expression-member": "off",
  },
});

type CreateOxlintConfigOptions = Omit<
  OxlintConfig,
  "extends" | "ignorePatterns"
> & {
  /** リポジトリ固有で追加したい ignore。共通の ignore の後ろに連結される。 */
  ignorePatterns?: string[];
};

/**
 * パッケージごとの設定を作る。`extends` と共通 `ignorePatterns` を必ず含むため、
 * 呼び出し側は差分だけを渡せばよい（`ignorePatterns` の再宣言漏れを防ぐ）。
 *
 * 注意: 返した設定はネスト設定として親設定を置き換える。
 * 全パッケージに効かせたい設定はここ（forge）に置くこと。
 */
export const createOxlintConfig = ({
  ignorePatterns: additionalIgnorePatterns = [],
  ...rest
}: CreateOxlintConfigOptions = {}) =>
  defineConfig({
    extends: [oxlintConfig],
    ignorePatterns: [...ignorePatterns, ...additionalIgnorePatterns],
    ...rest,
  });
