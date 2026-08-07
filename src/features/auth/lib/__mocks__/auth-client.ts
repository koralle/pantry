import { fn } from 'storybook/test'

export const authClient = {
  signIn: {
    email: fn()
  },
  signOut: fn()
}
