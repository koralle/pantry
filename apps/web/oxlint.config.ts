import { createOxlintConfig, vitestPreset } from "@pantry/forge/oxlint";
import { reactDoctorExemptions } from "@pantry/forge/react-doctor";
import type {
  Capability,
  OxlintRuleSeverity,
} from "oxlint-plugin-react-doctor";
import {
  REACT_DOCTOR_RULES,
  RECOMMENDED_RULES,
  TANSTACK_QUERY_RULES,
  TANSTACK_START_RULES,
} from "oxlint-plugin-react-doctor";
import landmines from "ultracite/oxlint/landmines";
import react from "ultracite/oxlint/react";
import tanstack from "ultracite/oxlint/tanstack";

// react-doctor CLI が package.json から組み立てるのと同じ能力の集合。
// react:18 / react:19 / react:19.2 は React 19.3 で満たされる階段。
const capabilities: ReadonlySet<Capability> = new Set([
  "react",
  "react-aria",
  "react:18",
  "react:19",
  "react:19.2",
  "ssr",
  "tanstack-query",
  "tanstack-start",
  "typescript",
]);

const reactDoctorEntryByKey = new Map(
  REACT_DOCTOR_RULES.map((entry) => [entry.key, entry])
);

// Ultracite の react プリセットが既に有効にしている組み込みルール名（接頭辞を落としたもの）。
const builtInReactRuleNames = new Set(
  Object.keys(react.rules ?? {}).map((key) => key.slice(key.indexOf("/") + 1))
);

// Oxlint は rules をそのまま登録するだけで、CLI がやっている requires
// （そのライブラリが入っている時だけ有効）の判定をしない。宣言した能力で
// 満たせないルールを落とし、入っていないライブラリ向けのルールを走らせない。
// 移植版（oxc の react / jsx-a11y / react_perf 由来）は、組み込み側が有効な
// ものだけ落とす。同じ指摘を 2 回出さないため。
const isReactDoctorRuleEnabled = (key: string): boolean => {
  const entry = reactDoctorEntryByKey.get(key);
  if (entry === undefined) {
    return false;
  }
  const { rule } = entry;
  if (rule.requires?.some((capability) => !capabilities.has(capability))) {
    return false;
  }
  if (rule.tags?.includes("react-jsx-only") && !capabilities.has("react")) {
    return false;
  }
  if (rule.disabledWhen?.some((capability) => capabilities.has(capability))) {
    return false;
  }
  return !(entry.originallyExternal && builtInReactRuleNames.has(entry.id));
};

// react-doctor の推奨セットは既定で warning が多い。厳し目なので全件 error にする。
// tanstack 系は framework が global ではないため推奨セットに入らない。
const asErrors = (
  rules: Readonly<Record<string, OxlintRuleSeverity>>
): Record<string, "error"> => {
  const enabled: Record<string, "error"> = {};
  for (const key of Object.keys(rules)) {
    if (isReactDoctorRuleEnabled(key)) {
      enabled[key] = "error";
    }
  }
  return enabled;
};

// Oxlint はファイルごとに「最も近い設定」だけを使い、親設定とは自動マージしない。
// そのためこのファイルは apps/web 配下のルート oxlint.config.ts を置き換える。
// 全パッケージに効かせたい設定は @pantry/forge/oxlint に置き、ここには差分だけを書く。
// パスはこのファイル（apps/web）からの相対で書く。
// landmines は「エージェントが green にするための近道」を止める opt-in プリセット。
// react / tanstack は React と TanStack Router を使うこのアプリだけに効かせる。
export default createOxlintConfig({
  extends: [react, tanstack, landmines, vitestPreset],
  jsPlugins: [
    ...(landmines.jsPlugins ?? []),
    { name: "storybook", specifier: "eslint-plugin-storybook" },
    { name: "react-doctor", specifier: "oxlint-plugin-react-doctor" },
  ],
  // react-doctor 本体（CLI）と同じ前提を渡す。`portedRuleMode` を curated に
  // しないと、oxc から移植した react 系ルールが upstream 挙動（誤検知寄り）で動く。
  settings: {
    "react-doctor": {
      capabilities: [...capabilities].toSorted(),
      framework: "tanstack-start",
      portedRuleMode: "curated",
    },
  },
  rules: {
    ...asErrors(RECOMMENDED_RULES),
    ...asErrors(TANSTACK_START_RULES),
    ...asErrors(TANSTACK_QUERY_RULES),
    // コメントは「なぜ」を残す規約（.agents/rules/ultracite.md）。差分を語るコメントの検出は要らない。
    "landmines-style/no-comments": "off",
    // 戻り値型は UI と hook の契約として明示する規約。
    "landmines-types/no-explicit-return-types": "off",
    // vi.fn での依存差し替えを前提にしたテストが残っている。MSW へ寄せるのは別作業。
    "landmines-testing/no-test-doubles": "off",
    // workerd 上の初回呼び出しは既定の 5 秒に収まらないことがあるため、この 1 件だけ待ち時間を延ばす。
    "landmines-testing/no-flake-masking": [
      "error",
      { allow: { "apps/web/src/rpc/client/client-boundary.test.ts": 1 } },
    ],
    // react プリセットのうち、このリポジトリで無効にしているもの。
    // プリセットを extends に移したため、forge 側の rules では上書きできない（extends が勝つ）。
    // `react/todo` はコードの TODO コメントではなく、oxlint 側の未実装マーカー
    // （`(BuildHIR::lowerAssignment) Handle ...`）を報告するため無効化する。
    // authClient の読み込みは effect 起点で setState する（TanStack Query へ寄せるのは別作業）。
    "react/set-state-in-effect": "off",
    "react/todo": "off",
  },
  overrides: [
    {
      files: ["src/routes/**/*.ts", "src/routes/**/*.tsx"],
      rules: {
        "func-style": "off",
        "no-use-before-define": "off",
        "react/function-component-definition": "off",
        "require-await": "off",
        // TanStack Router は `throw redirect()` / `throw notFound()` を制御フローに使う。
        // 投げる値は Error ではなく Response 相当なので、ルート層だけ例外にする。
        "typescript/only-throw-error": "off",
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
      // eslint-plugin-storybook の flat/recommended 相当。
      // Oxlint の files は ESLint の extglob（`@(ts|tsx)`）を解釈せず黙って無視するため brace で書く。
      files: [
        "**/*.stories.{ts,tsx,js,jsx,mjs,cjs}",
        "**/*.story.{ts,tsx,js,jsx,mjs,cjs}",
      ],
      rules: {
        "storybook/await-interactions": "error",
        "storybook/context-in-play-function": "error",
        "storybook/default-exports": "error",
        "storybook/hierarchy-separator": "error",
        "storybook/no-redundant-story-name": "error",
        "storybook/no-renderer-packages": "error",
        "storybook/prefer-pascal-case": "error",
        "storybook/story-exports": "error",
        "storybook/use-storybook-expect": "error",
        "storybook/use-storybook-testing-library": "error",
      },
    },
    {
      files: ["src/storybook/main.ts"],
      rules: {
        // storybook/no-uninstalled-addons は `export default { addons: [...] }` しか読まない。
        // この config は defineMain({...}) なので、addon の検査は効かない。
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
    {
      // ルートのソース契約を見るテストで、対象は隣の index.tsx（import ではなく readFileSync で読む）。
      files: ["src/routes/**/*.test.ts"],
      rules: { "landmines-structure/colocated-tests": "off" },
    },
    // 除外の正本は @pantry/forge/react-doctor（CLI 側の doctor.config.ts も読む）。
    ...reactDoctorExemptions.map(({ files, rules }) => ({
      files: [...files],
      rules: Object.fromEntries(rules.map((rule) => [rule, "off" as const])),
    })),
  ],
});
