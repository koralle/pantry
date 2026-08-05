import type { Config } from '@markuplint/ml-config'

const config = {
  extends: ['markuplint:recommended'],
  parser: {
    '\\.[jt]sx?$': '@markuplint/jsx-parser'
  },
  specs: {
    '\\.[jt]sx?$': '@markuplint/react-spec'
  },
  excludeFiles: ['**/node_modules/**', '**/*.stories.tsx'],
  pretenders: [
    {
      selector: 'HeadContent',
      as: 'meta'
    },
    {
      selector: 'Scripts',
      as: 'script'
    }
  ]
} as const satisfies Config

export default config
