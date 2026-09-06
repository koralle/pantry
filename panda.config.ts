import { defineConfig, defineGlobalStyles } from "@pandacss/dev";

const globalCss = defineGlobalStyles({
  "*, ::before, ::after": {
    boxSizing: "border-box",
  },
  "::placeholder": {
    opacity: "unset",
  },
  ':disabled, [aria-disabled="true"]': {
    cursor: "default",
  },
  ":focus-visible": {
    outline: "2px solid",
    outlineColor: "accent.solid",
    outlineOffset: "2px",
  },
  ":root": {
    WebkitTapHighlightColor: "transparent",
    WebkitTextSizeAdjust: "100%",
    accentColor: "accent.solid",
    colorScheme: "light",
    fontFamily: "body",
    fontSizeAdjust: "from-font",
    lineBreak: "strict",
    lineHeight: "body",
    overflowWrap: "anywhere",
    scrollbarGutter: "stable",
    textAutospace: "normal",
    textSizeAdjust: "100%",
    textSpacingTrim: "trim-start",
  },
  "@media (prefers-reduced-motion: reduce)": {
    "*, *::before, *::after": {
      animation: "none !important",
      transition: "none !important",
    },
  },
  '[hidden]:not([hidden="until-found"])': {
    display: "none !important",
  },
  "[popover]": {
    margin: "unset",
  },
  '[tabindex="-1"]:focus': {
    outline: "none !important",
  },
  a: {
    color: "unset",
  },
  "a:any-link": {
    textDecorationInset: "auto",
    textDecorationLine: "unset",
    textDecorationThickness: "from-font",
  },
  "address:lang(ja)": {
    fontStyle: "unset",
  },
  "blockquote, figure": {
    marginInline: "unset",
  },
  body: {
    background: "bg.canvas",
    color: "fg.default",
    margin: 0,
    minBlockSize: "100dvb",
  },
  "button, input, select, textarea, ::file-selector-button": {
    borderColor: "unset",
    borderRadius: "unset",
    borderStyle: "solid",
    borderWidth: "1px",
    color: "unset",
    font: "unset",
    letterSpacing: "unset",
    textAlign: "unset",
  },
  'button, input:is([type="button"], [type="submit"], [type="reset"]), ::file-selector-button':
    {
      backgroundColor: "unset",
    },
  'button, input:is([type="button"], [type="submit"], [type="reset"]), [role="tab"], [role="button"], [role="option"], ::file-selector-button':
    {
      touchAction: "manipulation",
    },
  'button:enabled, label[for], select:enabled, input:is([type="button"], [type="submit"], [type="reset"], [type="radio"], [type="checkbox"]):enabled, [role="tab"], [role="button"], [role="option"], :enabled::file-selector-button':
    {
      cursor: "pointer",
    },
  "caption, th": {
    textAlign: "unset",
  },
  "code, kbd, samp": {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontFeatureSettings: "initial",
    fontSize: "unset",
    fontVariantLigatures: "none",
    fontVariationSettings: "initial",
  },
  dd: {
    marginInlineStart: "unset",
  },
  dialog: {
    maxBlockSize: "unset",
    maxInlineSize: "unset",
  },
  "dialog, [popover]": {
    border: "unset",
    overscrollBehaviorBlock: "contain",
    padding: "unset",
  },
  "dialog::backdrop": {
    backgroundColor: "oklch(0% 0 0deg / 30%)",
  },
  "dialog:not([open], [popover]), [popover]:not(:popover-open)": {
    display: "none !important",
  },
  dt: {
    fontWeight: "bolder",
  },
  "em:lang(ja)": {
    fontWeight: "bolder",
  },
  fieldset: {
    border: "unset",
    marginInline: "unset",
    minInlineSize: 0,
    padding: "unset",
  },
  h1: {
    fontSize: "title",
    fontWeight: "bold",
    lineHeight: "tight",
    marginBlock: "unset",
    textWrap: "pretty",
  },
  "h2, h3, h4, h5, h6": {
    marginBlock: "unset",
  },
  "i:lang(ja), cite:lang(ja), dfn:lang(ja)": {
    fontStyle: "unset",
  },
  iframe: {
    border: "unset",
  },
  "img, svg, picture, video, audio, canvas, model, iframe, embed, object": {
    maxInlineSize: "100%",
    verticalAlign: "bottom",
  },
  "img, svg, picture, video, canvas, model, iframe, embed, object": {
    blockSize: "auto",
  },
  'input:is([type="radio"], [type="checkbox"])': {
    margin: "unset",
  },
  'input:not([type="button"], [type="submit"], [type="reset"]), textarea, [contenteditable]':
    {
      textAutospace: "no-autospace",
    },
  'input[type="file"]': {
    border: "unset",
  },
  'input[type="search"]': {
    WebkitAppearance: "textfield",
  },
  legend: {
    paddingInline: "unset",
  },
  "p, blockquote, figure, pre, address, ul, ol, dl, menu": {
    marginBlock: "unset",
  },
  "p:lang(en)": {
    textWrap: "pretty",
  },
  pre: {
    textAutospace: "no-autospace",
    textSpacingTrim: "space-all",
  },
  table: {
    borderCollapse: "collapse",
  },
  textarea: {
    marginBlock: "unset",
    resize: "block",
  },
  "ul, ol, menu": {
    listStyleType: '""',
    paddingInlineStart: "unset",
  },
});

export default defineConfig({
  exclude: [],

  globalCss,

  include: ["./src/**/*.{ts,tsx}"],

  jsxFramework: "react",

  outdir: "styled-system",

  preflight: false,

  strictPropertyValues: false,

  strictTokens: false,

  theme: {
    extend: {
      animationStyles: {
        crossfade: {
          value: {
            animationDuration: "crossfade",
            animationFillMode: "both",
            animationName: "crossfade",
            animationTimingFunction: "ease-out",
          },
        },
        fadeUp: {
          value: {
            animationDuration: "fadeUp",
            animationFillMode: "both",
            animationName: "fadeUp",
            animationTimingFunction: "ease-out",
          },
        },
        skeleton: {
          value: {
            animationDuration: "skeleton",
            animationIterationCount: "infinite",
            animationName: "skeletonPulse",
            animationTimingFunction: "ease-in-out",
          },
        },
      },
      keyframes: {
        crossfade: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(0.375rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        skeletonPulse: {
          "0%": { backgroundPosition: "100% 0" },
          "100%": { backgroundPosition: "-100% 0" },
        },
      },
      semanticTokens: {
        colors: {
          accent: {
            fg: { value: "{colors.pantry.surface}" },
            hover: {
              value:
                "color-mix(in oklab, {colors.pantry.accent} 10%, {colors.pantry.canvas})",
            },
            solid: { value: "{colors.pantry.accent}" },
            solidHover: {
              value:
                "color-mix(in oklab, {colors.pantry.accent} 82%, {colors.pantry.ink})",
            },
            subtle: {
              value:
                "color-mix(in oklab, {colors.pantry.accent} 14%, {colors.pantry.canvas})",
            },
          },
          bg: {
            canvas: { value: "{colors.pantry.canvas}" },
            surface: { value: "{colors.pantry.surface}" },
          },
          border: {
            accent: {
              value:
                "color-mix(in oklab, {colors.pantry.accent} 35%, {colors.pantry.line})",
            },
            danger: {
              value:
                "color-mix(in oklab, {colors.pantry.danger} 55%, {colors.pantry.line})",
            },
            default: { value: "{colors.pantry.line}" },
          },
          danger: {
            border: {
              value:
                "color-mix(in oklab, {colors.pantry.danger} 35%, {colors.pantry.line})",
            },
            solid: { value: "{colors.pantry.danger}" },
            surface: {
              value:
                "color-mix(in oklab, {colors.pantry.danger} 8%, {colors.pantry.canvas})",
            },
          },
          fg: {
            default: { value: "{colors.pantry.ink}" },
            muted: { value: "{colors.pantry.muted}" },
          },
          overlay: {
            backdrop: {
              value:
                "color-mix(in oklab, {colors.pantry.ink} 35%, transparent)",
            },
          },
          skeleton: {
            middle: {
              value:
                "color-mix(in oklab, {colors.pantry.line} 15%, {colors.pantry.canvas})",
            },
            start: {
              value:
                "color-mix(in oklab, {colors.pantry.line} 35%, {colors.pantry.canvas})",
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
        },
      },
      tokens: {
        borderWidths: {
          medium: { value: "2px" },
          none: { value: "0" },
          thick: { value: "3px" },
          thin: { value: "1px" },
        },
        colors: {
          pantry: {
            accent: { value: "#2f6f6a" },
            canvas: { value: "#f3f4f6" },
            danger: { value: "#8a2f2f" },
            ink: { value: "#1f2328" },
            line: { value: "#d1d5db" },
            muted: { value: "#5b616a" },
            surface: { value: "#f7f8f9" },
          },
        },
        durations: {
          crossfade: { value: "160ms" },
          fadeUp: { value: "200ms" },
          hover: { value: "180ms" },
          press: { value: "120ms" },
          skeleton: { value: "1.2s" },
          spin: { value: "1s" },
        },
        easings: {
          press: { value: "cubic-bezier(0.16, 1, 0.3, 1)" },
        },
        fontSizes: {
          "2xs": { value: "0.75rem" },
          "3xl": { value: "1.75rem" },
          lg: { value: "1.25rem" },
          md: { value: "1.125rem" },
          md2: { value: "1.05rem" },
          title: { value: "clamp(1.5rem, 2.4vw, 2rem)" },
          xs: { value: "0.875rem" },
          xs2: { value: "0.8125rem" },
        },
        fonts: {
          body: {
            value: [
              "Noto Sans JP",
              "Hiragino Sans",
              "Yu Gothic UI",
              "sans-serif",
            ],
          },
        },
        lineHeights: {
          body: { value: "1.5" },
          relaxed: { value: "1.7" },
          tight: { value: "1.25" },
        },
        radii: {
          box: { value: "6px" },
          full: { value: "999px" },
          sheet: { value: "12px" },
        },
        shadows: {
          accentRing: { value: "0 0 0 2px {colors.accent.subtle}" },
        },
        sizes: {
          "100dvb": { value: "100dvb" },
          "100dvh": { value: "100dvh" },
          "11": { value: "2.75rem" },
          "12rem": { value: "12rem" },
          "16rem": { value: "16rem" },
          "18rem": { value: "18rem" },
          "22": { value: "5.5rem" },
          "22rem": { value: "22rem" },
          "24rem": { value: "24rem" },
          "28rem": { value: "28rem" },
          "36rem": { value: "36rem" },
          "4.5rem": { value: "4.5rem" },
          "42rem": { value: "42rem" },
          "48rem": { value: "48rem" },
          "4rem": { value: "4rem" },
          "5.5": { value: "1.375rem" },
          "5.5rem": { value: "5.5rem" },
          "85dvh": { value: "85dvh" },
          "dialog-width": { value: "calc(100% - 2rem)" },
          fit: { value: "fit-content" },
          "min-10": { value: "min(100%, 10rem)" },
          "min-12": { value: "min(100%, 12rem)" },
          "min-18": { value: "min(100%, 18rem)" },
          "min-22": { value: "min(100%, 22rem)" },
          touch: { value: "44px" },
        },
      },
    },
  },

  validation: "error",
});
