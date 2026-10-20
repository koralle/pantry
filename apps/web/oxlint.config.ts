import { createOxlintConfig } from "@pantry/forge/oxlint";

// Oxlint はファイルごとに「最も近い設定」だけを使い、親設定とは自動マージしない。
// そのためこのファイルは apps/web 配下のルート oxlint.config.ts を置き換える。
// 全パッケージに効かせたい設定は @pantry/forge/oxlint に置き、ここには差分だけを書く。
// パスはこのファイル（apps/web）からの相対で書く。
export default createOxlintConfig({
  overrides: [
    {
      files: ["src/routes/**/*.ts", "src/routes/**/*.tsx"],
      rules: {
        "func-style": "off",
        "no-use-before-define": "off",
        "react/function-component-definition": "off",
        "require-await": "off",
        "unicorn/no-await-expression-member": "off",
      },
    },
    {
      files: [
        "**/*.stories.ts",
        "**/*.stories.tsx",
        "src/stories/**/*.ts",
        "src/stories/**/*.tsx",
        "src/storybook/**/*.ts",
        "src/storybook/**/*.tsx",
      ],
      rules: {
        "func-style": "off",
        "no-await-in-loop": "off",
        "no-bitwise": "off",
        "no-empty-function": "off",
        "no-eq-null": "off",
        "no-nested-ternary": "off",
        "no-promise-executor-return": "off",
        "no-use-before-define": "off",
        "prefer-named-capture-group": "off",
        "promise/avoid-new": "off",
        "react/function-component-definition": "off",
        "require-await": "off",
        "require-unicode-regexp": "off",
        "typescript/array-type": "off",
        "typescript/await-thenable": "off",
        "typescript/no-confusing-void-expression": "off",
        "typescript/no-floating-promises": "off",
        "typescript/no-non-null-assertion": "off",
        "typescript/no-unnecessary-type-conversion": "off",
        "typescript/no-unsafe-type-assertion": "off",
        "typescript/prefer-nullish-coalescing": "off",
        "typescript/promise-function-async": "off",
        "typescript/strict-void-return": "off",
        "unicorn/filename-case": "off",
        "unicorn/import-style": "off",
      },
    },
    {
      files: ["src/storybook/main.ts"],
      rules: {
        "unicorn/prefer-import-meta-properties": "off",
      },
    },
    {
      files: ["src/features/bookmarks/server/fetch-page-title.server.ts"],
      rules: {
        complexity: "off",
        eqeqeq: "off",
        "no-await-in-loop": "off",
        "no-bitwise": "off",
        "no-eq-null": "off",
        "no-use-before-define": "off",
        "prefer-named-capture-group": "off",
        "require-unicode-regexp": "off",
        "typescript/no-unsafe-argument": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-call": "off",
        "typescript/no-unsafe-member-access": "off",
        "typescript/no-unsafe-type-assertion": "off",
        "unicorn/no-lonely-if": "off",
      },
    },
  ],
});
