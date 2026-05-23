import { defineConfig } from 'oxfmt'

export default defineConfig({
  bracketSpacing: true,
  bracketSameLine: true,
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
