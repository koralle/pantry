import { defineSemanticTokens } from "@pandacss/dev";

export const semanticColors = defineSemanticTokens({
  colors: {
    bg: {
      canvas: { value: "{colors.pantry.canvas}" },
      surface: { value: "{colors.pantry.surface}" },
    },
    fg: {
      default: { value: "{colors.pantry.ink}" },
      muted: { value: "{colors.pantry.muted}" },
    },
    border: {
      default: { value: "{colors.pantry.line}" },
      accent: {
        value:
          "color-mix(in oklab, {colors.pantry.accent} 35%, {colors.pantry.line})",
      },
      danger: {
        value:
          "color-mix(in oklab, {colors.pantry.danger} 55%, {colors.pantry.line})",
      },
    },
    accent: {
      solid: { value: "{colors.pantry.accent}" },
      solidHover: {
        value:
          "color-mix(in oklab, {colors.pantry.accent} 82%, {colors.pantry.ink})",
      },
      subtle: {
        value:
          "color-mix(in oklab, {colors.pantry.accent} 14%, {colors.pantry.canvas})",
      },
      hover: {
        value:
          "color-mix(in oklab, {colors.pantry.accent} 10%, {colors.pantry.canvas})",
      },
      fg: { value: "{colors.pantry.surface}" },
    },
    danger: {
      solid: { value: "{colors.pantry.danger}" },
      surface: {
        value:
          "color-mix(in oklab, {colors.pantry.danger} 8%, {colors.pantry.canvas})",
      },
      border: {
        value:
          "color-mix(in oklab, {colors.pantry.danger} 35%, {colors.pantry.line})",
      },
    },
    surface: {
      header: {
        value: "{colors.pantry.canvas}",
      },
      rail: {
        value:
          "color-mix(in oklab, {colors.pantry.line} 22%, {colors.pantry.canvas})",
      },
      tag: {
        value:
          "color-mix(in oklab, {colors.pantry.accent} 8%, {colors.pantry.canvas})",
      },
    },
    overlay: {
      backdrop: {
        value: "color-mix(in oklab, {colors.pantry.ink} 35%, transparent)",
      },
    },
    skeleton: {
      start: {
        value:
          "color-mix(in oklab, {colors.pantry.line} 35%, {colors.pantry.canvas})",
      },
      middle: {
        value:
          "color-mix(in oklab, {colors.pantry.line} 15%, {colors.pantry.canvas})",
      },
    },
  },
});
