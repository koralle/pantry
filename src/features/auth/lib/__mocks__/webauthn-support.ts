import { fn } from 'storybook/test'

export const isWebAuthnAvailable = fn(() => true)

export const isConditionalMediationAvailable = fn(async () => false)
