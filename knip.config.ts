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
    "apps/web": {
      // Maintenance scripts and the Node-only Better Auth entry they import.
      // The tanstack-entry stub is an alias target loaded by the Vitest bundler
      // (see vitest.config.ts resolve.alias); Knip cannot trace that reference.
      entry: ["auth.ts", "scripts/**/*.ts", "vitest/tanstack-entry-stub.ts"],
      vitest: {
        config: ["vitest.config.ts", "vitest.persistence.config.ts"],
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
    "packages/db": {
      vitest: {
        config: "vitest.config.ts",
      },
      ignoreDependencies: [
        // npm script の bin としてのみ使う（Better Auth CLI）
        "auth",
      ],
    },
  },
};

export default config;
