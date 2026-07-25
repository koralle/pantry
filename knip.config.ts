import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  tags: ['-lintignore'],
  // Maintenance scripts and the Node-only Better Auth entry they import.
  // Nested `dotenvx` / `pnpm` wrappers are not fully resolved by the script parser.
  entry: ['auth.ts', 'scripts/**/*.ts'],
  storybook: {
    config: ['src/storybook/main.ts'],
    entry: [
      'src/storybook/{preview,manager,index,vite.config}.{ts,tsx}',
      'src/**/*.stories.@(ts|tsx)'
    ]
  },
  ignore: [
    // Known unused — leave in place for now; catch new unused files as errors
    'src/components/error-fallback.tsx',
    'src/entities/tag.ts'
  ],
  // Do not parse lefthook.yaml / git hooks for entry scripts and binaries.
  lefthook: false,
  ignoreDependencies: [
    // Virtual module: `cloudflare:workers` (Workers runtime, not an npm package)
    'cloudflare',
    // Used by git hooks; excluded from analysis via `lefthook: false` above
    'lefthook',
    // Referenced from TypeSpec sources under api-spec/, not from TS/JS
    '@typespec/http',
    '@typespec/openapi',
    '@typespec/openapi3',
    '@typespec/rest'
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
