import { defineConfig } from 'oxfmt'

export default defineConfig({
  bracketSameLine: true,
  bracketSpacing: true,
  ignorePatterns: ['pnpm-lock.yaml'],
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
