import addonDocs from '@storybook/addon-docs'
import { definePreview } from '@storybook/tanstack-react'

import '../index.css'

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
