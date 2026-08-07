import addonDocs from '@storybook/addon-docs'
import { definePreview } from '@storybook/tanstack-react'
import { sb } from 'storybook/test'

import '../index.css'

sb.mock('../features/auth/lib/auth-client.ts')

export default definePreview({
  parameters: {
    layout: 'padded',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  },

  addons: [addonDocs()]
})
