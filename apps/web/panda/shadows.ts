import { defineTokens } from "@pandacss/dev";

export const shadows = defineTokens({
  shadows: {
    surface: {
      value:
        "0 1px 2px rgba(17, 24, 28, 0.04), 0 2px 8px -2px rgba(17, 24, 28, 0.04)",
    },
    card: {
      value:
        "0 1px 2px rgba(17, 24, 28, 0.05), 0 4px 12px -2px rgba(17, 24, 28, 0.04)",
    },
    cardHover: {
      value:
        "0 2px 4px rgba(17, 24, 28, 0.06), 0 10px 24px -4px rgba(17, 24, 28, 0.1)",
    },
    accentRing: { value: "0 0 0 3px {colors.accent.subtle}" },
    dialog: {
      value:
        "0 4px 12px rgba(0, 0, 0, 0.08), 0 24px 48px -12px rgba(0, 0, 0, 0.24)",
    },
    fab: {
      value:
        "0 4px 12px rgba(13, 110, 102, 0.28), 0 10px 24px -6px rgba(13, 110, 102, 0.35)",
    },
  },
});
