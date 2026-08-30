import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  tags: ['-lintignore'],
  // Maintenance scripts and the Node-only Better Auth entry they import.
  // Nested `dotenvx` / `pnpm` wrappers are not fully resolved by the script parser.
  // The tanstack-entry stub is an alias target loaded by the Vitest bundler
  // (see vitest.config.ts resolve.alias); Knip cannot trace that reference.
  entry: ['auth.ts', 'scripts/**/*.ts', 'vitest/tanstack-entry-stub.ts'],
  vitest: {
    config: ['vitest.config.ts', 'vitest.persistence.config.ts']
  },
  storybook: {
    config: ['src/storybook/main.ts'],
    entry: [
      'src/storybook/{preview,manager,index,vite.config}.{ts,tsx}',
      'src/**/*.stories.@(ts|tsx)'
    ]
  },
  // Agent skills are repository tooling, not application entry points.
  ignore: ['.agents/**'],
  // Do not parse lefthook.yaml / git hooks for entry scripts and binaries.
  lefthook: false,
  ignoreDependencies: [
    // Virtual module: `cloudflare:workers` (Workers runtime, not an npm package)
    'cloudflare',
    // Used by git hooks; excluded from analysis via `lefthook: false` above
    'lefthook',
    // Referenced by string name from `.markuplintrc` (parser / specs)
    '@markuplint/jsx-parser',
    '@markuplint/react-spec',
    // Dev-only CDN script URL in RootDocument; intentionally not module-imported
    'react-scan',
    // Self-hosted typeface loaded via @import in src/index.css
    '@fontsource/noto-sans-jp'
  ],
  rules: {
    // Existing unused exports/types/catalog noise — ratchets later
    exports: 'warn',
    types: 'warn',
    nsExports: 'warn',
    nsTypes: 'warn',
    enumMembers: 'warn',
    namespaceMembers: 'warn',
    duplicates: 'warn',
    catalog: 'warn'
  }
}

export default config
