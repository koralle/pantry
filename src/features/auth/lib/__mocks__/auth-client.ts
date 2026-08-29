import { fn } from 'storybook/test'

export const authClient = {
  signIn: {
    email: fn(),
    passkey: fn()
  },
  signOut: fn(),
  passkey: {
    addPasskey: fn(),
    listUserPasskeys: fn(),
    updatePasskey: fn(),
    deletePasskey: fn()
  }
}
