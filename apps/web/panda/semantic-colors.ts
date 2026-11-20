import { defineSemanticTokens } from "@pandacss/dev";

export const semanticColors = defineSemanticTokens({
  colors: {
    bg: {
      canvas: {
        value: {
          base: "{colors.pantry.canvas}",
          _osDark: "{colors.pantryDark.canvas}",
        },
      },
      surface: {
        value: {
          base: "{colors.pantry.surface}",
          _osDark: "{colors.pantryDark.surface}",
        },
      },
      surfaceTranslucent: {
        value: {
          base: "color-mix(in oklab, {colors.pantry.surface} 86%, transparent)",
          _osDark:
            "color-mix(in oklab, {colors.pantryDark.surface} 86%, transparent)",
        },
      },
    },
    fg: {
      default: {
        value: {
          base: "{colors.pantry.ink}",
          _osDark: "{colors.pantryDark.ink}",
        },
      },
      muted: {
        value: {
          base: "{colors.pantry.muted}",
          _osDark: "{colors.pantryDark.muted}",
        },
      },
      faint: {
        value: {
          base: "{colors.pantry.faint}",
          _osDark: "{colors.pantryDark.faint}",
        },
      },
    },
    border: {
      default: {
        value: {
          base: "{colors.pantry.line}",
          _osDark: "{colors.pantryDark.line}",
        },
      },
      control: {
        value: {
          base: "{colors.pantry.lineStrong}",
          _osDark: "{colors.pantryDark.lineStrong}",
        },
      },
      accent: {
        value: {
          base: "color-mix(in oklab, {colors.pantry.accent} 38%, {colors.pantry.line})",
          _osDark:
            "color-mix(in oklab, {colors.pantryDark.accent} 42%, {colors.pantryDark.line})",
        },
      },
      danger: {
        value: {
          base: "color-mix(in oklab, {colors.pantry.danger} 55%, {colors.pantry.line})",
          _osDark:
            "color-mix(in oklab, {colors.pantryDark.danger} 55%, {colors.pantryDark.line})",
        },
      },
    },
    accent: {
      solid: {
        value: {
          base: "{colors.pantry.accent}",
          _osDark: "{colors.pantryDark.accent}",
        },
      },
      solidHover: {
        value: {
          base: "color-mix(in oklab, {colors.pantry.accent} 85%, {colors.pantry.ink})",
          _osDark: "{colors.pantryDark.accentHover}",
        },
      },
      subtle: {
        value: {
          base: "{colors.pantry.accentSoft}",
          _osDark: "{colors.pantryDark.accentSoft}",
        },
      },
      hover: {
        value: {
          base: "color-mix(in oklab, {colors.pantry.accent} 10%, {colors.pantry.canvas})",
          _osDark:
            "color-mix(in oklab, {colors.pantryDark.accent} 14%, {colors.pantryDark.surface})",
        },
      },
      fg: {
        value: {
          base: "{colors.pantry.surface}",
          _osDark: "{colors.pantryDark.accentInk}",
        },
      },
    },
    danger: {
      solid: {
        value: {
          base: "{colors.pantry.danger}",
          _osDark: "{colors.pantryDark.danger}",
        },
      },
      surface: {
        value: {
          base: "{colors.pantry.dangerSoft}",
          _osDark: "{colors.pantryDark.dangerSoft}",
        },
      },
      border: {
        value: {
          base: "color-mix(in oklab, {colors.pantry.danger} 35%, {colors.pantry.line})",
          _osDark:
            "color-mix(in oklab, {colors.pantryDark.danger} 45%, {colors.pantryDark.line})",
        },
      },
    },
    surface: {
      muted: {
        value: {
          base: "{colors.pantry.surfaceMuted}",
          _osDark: "{colors.pantryDark.surfaceMuted}",
        },
      },
      header: {
        value: {
          base: "{colors.pantry.canvas}",
          _osDark: "{colors.pantryDark.canvas}",
        },
      },
      rail: {
        value: {
          base: "color-mix(in oklab, {colors.pantry.line} 22%, {colors.pantry.canvas})",
          _osDark: "{colors.pantryDark.surface}",
        },
      },
      tag: {
        value: {
          base: "color-mix(in oklab, {colors.pantry.accent} 8%, {colors.pantry.canvas})",
          _osDark: "{colors.pantryDark.accentSoft}",
        },
      },
    },
    inbox: {
      bgStart: {
        value: {
          base: "{colors.pantry.inboxStart}",
          _osDark: "{colors.pantryDark.inboxStart}",
        },
      },
      bgEnd: {
        value: {
          base: "{colors.pantry.inboxEnd}",
          _osDark: "{colors.pantryDark.inboxEnd}",
        },
      },
      fg: {
        value: {
          base: "{colors.pantry.inboxFg}",
          _osDark: "{colors.pantryDark.inboxFg}",
        },
      },
      sub: {
        value: {
          base: "{colors.pantry.inboxSub}",
          _osDark: "{colors.pantryDark.inboxSub}",
        },
      },
      border: {
        value: {
          base: "color-mix(in oklab, {colors.pantry.inboxFg} 24%, {colors.pantry.line})",
          _osDark:
            "color-mix(in oklab, {colors.pantryDark.inboxFg} 28%, {colors.pantryDark.line})",
        },
      },
    },
    star: {
      solid: {
        value: {
          base: "{colors.pantry.star}",
          _osDark: "{colors.pantryDark.star}",
        },
      },
    },
    overlay: {
      backdrop: {
        value: {
          base: "color-mix(in oklab, {colors.pantry.ink} 38%, transparent)",
          _osDark: "color-mix(in oklab, #000000 62%, transparent)",
        },
      },
    },
    skeleton: {
      start: {
        value: {
          base: "color-mix(in oklab, {colors.pantry.line} 55%, {colors.pantry.canvas})",
          _osDark: "{colors.pantryDark.surfaceMuted}",
        },
      },
      middle: {
        value: {
          base: "color-mix(in oklab, {colors.pantry.line} 20%, {colors.pantry.canvas})",
          _osDark: "{colors.pantryDark.line}",
        },
      },
    },
  },
});
