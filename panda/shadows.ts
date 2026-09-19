import { defineTokens } from "@pandacss/dev";

export const shadows = defineTokens({
  shadows: {
    accentRing: { value: "0 0 0 2px {colors.accent.subtle}" },
    dialog: { value: "0 20px 50px rgba(0, 0, 0, 0.25)" },
  },
});
