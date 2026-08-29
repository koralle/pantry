import addonDocs from '@storybook/addon-docs'
import { definePreview } from '@storybook/tanstack-react'
import { AWESOME_DEVICE_VIEWPORTS } from 'storybook-device-viewports'
import { sb } from 'storybook/test'

import '../index.css'

sb.mock('../features/auth/lib/auth-client.ts')
sb.mock('../features/auth/lib/passkey/webauthn-support.ts')

export default definePreview({
  parameters: {
    layout: 'padded',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    viewport: {
      options: AWESOME_DEVICE_VIEWPORTS
    }
  },

  addons: [addonDocs()]
})
