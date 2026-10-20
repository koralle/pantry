import type { KnipConfig } from "knip";

const config: KnipConfig = {
  tags: ["-lintignore"],
  // Do not parse lefthook.yaml / git hooks for entry scripts and binaries.
  lefthook: false,
  rules: {
    // Existing unused exports/types/catalog noise — ratchets later
    exports: "warn",
    types: "warn",
    nsExports: "warn",
    nsTypes: "warn",
    enumMembers: "warn",
    namespaceMembers: "warn",
    duplicates: "warn",
    catalog: "warn",
  },
  workspaces: {
    ".": {
      ignoreDependencies: [
        // Used by git hooks; excluded from analysis via `lefthook: false` above
        "lefthook",
        // Referenced by string name from `.markuplintrc` (parser / specs)
        "@markuplint/jsx-parser",
        "@markuplint/react-spec",
      ],
    },
    "apps/api": {
      // Maintenance scripts (seed / create-user) run with tsx.
      entry: ["scripts/**/*.ts"],
      vitest: {
        config: ["vitest.config.ts"],
      },
      ignoreDependencies: [
        // Virtual module: `cloudflare:workers` (Workers runtime, not an npm package)
        "cloudflare",
      ],
    },
    "apps/web": {
      // The tanstack-entry stub is an alias target loaded by the Vitest bundler
      // (see vitest.config.ts resolve.alias); Knip cannot trace that reference.
      entry: ["vitest/tanstack-entry-stub.ts"],
      vitest: {
        config: ["vitest.config.ts"],
      },
      storybook: {
        config: ["src/storybook/main.ts"],
        entry: [
          "src/storybook/{preview,manager,index,vite.config}.{ts,tsx}",
          "src/**/*.stories.@(ts|tsx)",
        ],
      },
      ignoreDependencies: [
        // Virtual module: `cloudflare:workers` (Workers runtime, not an npm package)
        "cloudflare",
        // Dev-only CDN script URL in RootDocument; intentionally not module-imported
        "react-scan",
        // Self-hosted typeface loaded via @import in src/index.css
        "@fontsource/noto-sans-jp",
      ],
    },
    "packages/api-contract": {
      vitest: {
        config: "vitest.config.ts",
      },
    },
    "packages/db": {
      vitest: {
        config: "vitest.config.ts",
      },
    },
    "packages/env": {
      // lefthook.yaml の post-checkout から `pnpm exec tsx` で呼ぶ。
      // lefthook の解析を切っているため entry として明示する。
      entry: ["scripts/symlink-env-for-worktree.ts"],
      ignoreDependencies: [
        // lefthook から `pnpm exec tsx` で実行する script runner
        "tsx",
      ],
    },
    "packages/utils": {
      vitest: {
        config: "vitest.config.ts",
      },
    },
  },
};

export default config;
