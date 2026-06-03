import { defineConfig } from 'oxfmt'

export default defineConfig({
  bracketSameLine: true,
  bracketSpacing: true,
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
