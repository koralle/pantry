import { defineConfig } from 'oxfmt'

export default defineConfig({
  bracketSameLine: true,
  bracketSpacing: true,
  ignorePatterns: [
    'pnpm-lock.yaml',
    'src/routeTree.gen.ts',
    // Nested ``` fences; oxfmt collapsing ```` markdown breaks the template.
    '.agents/skills/improve-animations/PLAN-TEMPLATE.md'
  ],
  jsxSingleQuote: true,
  semi: false,
  singleAttributePerLine: true,
  singleQuote: true,
  sortImports: true,
  sortPackageJson: {
    sortScripts: true
  },
  trailingComma: 'none'
})
