import { defineTokens } from "@pandacss/dev";

export const typography = defineTokens({
  fontSizes: {
    "2xs": { value: "0.75rem" },
    xs2: { value: "0.8125rem" },
    xs: { value: "0.875rem" },
    md2: { value: "1.05rem" },
    md: { value: "1.125rem" },
    lg: { value: "1.25rem" },
    "3xl": { value: "1.75rem" },
    title: { value: "clamp(1.5rem, 2.4vw, 2rem)" },
  },
  fonts: {
    body: {
      value: ["Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", "sans-serif"],
    },
  },
  lineHeights: {
    tight: { value: "1.25" },
    body: { value: "1.5" },
    relaxed: { value: "1.7" },
  },
});
