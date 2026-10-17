import { fn } from "storybook/test";

export const authClient = {
  passkey: {
    addPasskey: fn(),
    deletePasskey: fn(),
    listUserPasskeys: fn(),
    updatePasskey: fn(),
  },
  signIn: {
    email: fn(),
    passkey: fn(),
  },
  signOut: fn(),
};
