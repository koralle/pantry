import { defineConfig, defineGlobalStyles } from '@pandacss/dev'

const globalCss = defineGlobalStyles({
  '*, ::before, ::after': {
    boxSizing: 'border-box'
  },
  ':root': {
    fontFamily: 'body',
    lineHeight: 'body',
    textSpacingTrim: 'trim-start',
    textAutospace: 'normal',
    lineBreak: 'strict',
    overflowWrap: 'anywhere',
    WebkitTextSizeAdjust: '100%',
    textSizeAdjust: '100%',
    scrollbarGutter: 'stable',
    WebkitTapHighlightColor: 'transparent'
  },
  body: {
    minBlockSize: '100dvb',
    margin: 0,
    background: 'bg.canvas',
    color: 'fg.default'
  },
  'h1:lang(en)': {
    textWrap: 'pretty'
  },
  h1: {
    marginBlock: '0.67em',
    fontSize: '2em'
  },
  'h2, h3, h4, h5, h6': {
    marginBlock: 'unset'
  },
  'p, blockquote, figure, pre, address, ul, ol, dl, menu': {
    marginBlock: 'unset'
  },
  'blockquote, figure': {
    marginInline: 'unset'
  },
  'p:lang(en)': {
    textWrap: 'pretty'
  },
  'address:lang(ja)': {
    fontStyle: 'unset'
  },
  'ul, ol, menu': {
    paddingInlineStart: 'unset',
    listStyleType: '""'
  },
  dt: {
    fontWeight: 'bolder'
  },
  dd: {
    marginInlineStart: 'unset'
  },
  pre: {
    textSpacingTrim: 'space-all',
    textAutospace: 'no-autospace'
  },
  'em:lang(ja)': {
    fontWeight: 'bolder'
  },
  'i:lang(ja), cite:lang(ja), dfn:lang(ja)': {
    fontStyle: 'unset'
  },
  'code, kbd, samp': {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontFeatureSettings: 'initial',
    fontVariationSettings: 'initial',
    fontSize: 'unset',
    fontVariantLigatures: 'none'
  },
  a: {
    color: 'unset'
  },
  'a:any-link': {
    textDecorationLine: 'unset',
    textDecorationThickness: 'from-font',
    textDecorationInset: 'auto'
  },
  'img, svg, picture, video, audio, canvas, model, iframe, embed, object': {
    maxInlineSize: '100%',
    verticalAlign: 'bottom'
  },
  'img, svg, picture, video, canvas, model, iframe, embed, object': {
    blockSize: 'auto'
  },
  iframe: {
    border: 'unset'
  },
  table: {
    borderCollapse: 'collapse'
  },
  'caption, th': {
    textAlign: 'unset'
  },
  'button, input, select, textarea, ::file-selector-button': {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'unset',
    borderRadius: 'unset',
    color: 'unset',
    font: 'unset',
    letterSpacing: 'unset',
    textAlign: 'unset'
  },
  'input:is([type="radio"], [type="checkbox"])': {
    margin: 'unset'
  },
  'input[type="file"]': {
    border: 'unset'
  },
  'input[type="search"]': {
    WebkitAppearance: 'textfield'
  },
  textarea: {
    marginBlock: 'unset',
    resize: 'block'
  },
  'input:not([type="button"], [type="submit"], [type="reset"]), textarea, [contenteditable]': {
    textAutospace: 'no-autospace'
  },
  'button, input:is([type="button"], [type="submit"], [type="reset"]), ::file-selector-button': {
    backgroundColor: 'unset'
  },
  'button, input:is([type="button"], [type="submit"], [type="reset"]), [role="tab"], [role="button"], [role="option"], ::file-selector-button':
    {
      touchAction: 'manipulation'
    },
  'button:enabled, label[for], select:enabled, input:is([type="button"], [type="submit"], [type="reset"], [type="radio"], [type="checkbox"]):enabled, [role="tab"], [role="button"], [role="option"], :enabled::file-selector-button':
    {
      cursor: 'pointer'
    },
  fieldset: {
    minInlineSize: 0,
    marginInline: 'unset',
    padding: 'unset',
    border: 'unset'
  },
  legend: {
    paddingInline: 'unset'
  },
  '::placeholder': {
    opacity: 'unset'
  },
  'dialog, [popover]': {
    overscrollBehaviorBlock: 'contain',
    padding: 'unset',
    border: 'unset'
  },
  'dialog:not([open], [popover]), [popover]:not(:popover-open)': {
    display: 'none !important'
  },
  dialog: {
    maxInlineSize: 'unset',
    maxBlockSize: 'unset'
  },
  'dialog::backdrop': {
    backgroundColor: 'oklch(0% 0 0deg / 30%)'
  },
  '[popover]': {
    margin: 'unset'
  },
  ':focus-visible': {
    outline: '2px solid',
    outlineColor: 'accent.solid',
    outlineOffset: '2px'
  },
  '[tabindex="-1"]:focus': {
    outline: 'none !important'
  },
  ':disabled, [aria-disabled="true"]': {
    cursor: 'default'
  },
  '[hidden]:not([hidden="until-found"])': {
    display: 'none !important'
  },
  '@media (prefers-reduced-motion: reduce)': {
    '*, *::before, *::after': {
      animationDuration: '0.01ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.01ms !important'
    }
  }
})

export default defineConfig({
  preflight: false,

  include: ['./src/**/*.{ts,tsx}'],

  exclude: [],

  globalCss,

  theme: {
    extend: {
      tokens: {
        colors: {
          pantry: {
            canvas: { value: '#f7f6f3' },
            ink: { value: '#1c1b19' },
            muted: { value: '#5c5955' },
            line: { value: '#d9d4cc' },
            accent: { value: '#2f6f6a' },
            surface: { value: '#fff' },
            danger: { value: '#8a2f2f' }
          }
        },
        radii: {
          box: { value: '6px' },
          sheet: { value: '12px' },
          full: { value: '999px' }
        },
        sizes: {
          touch: { value: '44px' },
          '5.5': { value: '1.375rem' },
          '11': { value: '2.75rem' },
          '22': { value: '5.5rem' },
          '4rem': { value: '4rem' },
          '4.5rem': { value: '4.5rem' },
          '5.5rem': { value: '5.5rem' },
          '18rem': { value: '18rem' },
          '12rem': { value: '12rem' },
          '16rem': { value: '16rem' },
          '22rem': { value: '22rem' },
          '24rem': { value: '24rem' },
          '28rem': { value: '28rem' },
          '36rem': { value: '36rem' },
          '42rem': { value: '42rem' },
          '48rem': { value: '48rem' },
          'min-10': { value: 'min(100%, 10rem)' },
          'min-22': { value: 'min(100%, 22rem)' },
          'min-18': { value: 'min(100%, 18rem)' },
          'min-12': { value: 'min(100%, 12rem)' },
          '100dvh': { value: '100dvh' },
          '100dvb': { value: '100dvb' },
          '85dvh': { value: '85dvh' },
          'dialog-width': { value: 'calc(100% - 2rem)' },
          fit: { value: 'fit-content' }
        },
        borderWidths: {
          none: { value: '0' },
          thin: { value: '1px' },
          medium: { value: '2px' },
          thick: { value: '3px' }
        },
        shadows: {
          accentRing: { value: '0 0 0 2px {colors.accent.subtle}' }
        },
        fontSizes: {
          '2xs': { value: '0.75rem' },
          xs2: { value: '0.8125rem' },
          xs: { value: '0.875rem' },
          md2: { value: '1.05rem' },
          md: { value: '1.125rem' },
          lg: { value: '1.25rem' },
          '3xl': { value: '1.75rem' },
          title: { value: 'clamp(1.5rem, 2.4vw, 2rem)' }
        },
        durations: {
          skeleton: { value: '1.2s' },
          spin: { value: '1s' },
          fadeUp: { value: '200ms' },
          crossfade: { value: '160ms' }
        },
        fonts: {
          body: { value: 'sans-serif' }
        },
        lineHeights: {
          body: { value: '1.5' },
          tight: { value: '1.25' },
          relaxed: { value: '1.7' }
        }
      },
      semanticTokens: {
        colors: {
          bg: {
            canvas: { value: '{colors.pantry.canvas}' },
            surface: { value: '{colors.pantry.surface}' }
          },
          fg: {
            default: { value: '{colors.pantry.ink}' },
            muted: { value: '{colors.pantry.muted}' }
          },
          border: {
            default: { value: '{colors.pantry.line}' },
            accent: {
              value: 'color-mix(in oklab, {colors.pantry.accent} 35%, {colors.pantry.line})'
            },
            danger: {
              value: 'color-mix(in oklab, {colors.pantry.danger} 55%, {colors.pantry.line})'
            }
          },
          accent: {
            solid: { value: '{colors.pantry.accent}' },
            subtle: {
              value: 'color-mix(in oklab, {colors.pantry.accent} 14%, white)'
            },
            fg: { value: '{colors.pantry.surface}' }
          },
          danger: {
            solid: { value: '{colors.pantry.danger}' },
            surface: {
              value: 'color-mix(in oklab, {colors.pantry.danger} 8%, white)'
            },
            border: {
              value: 'color-mix(in oklab, {colors.pantry.danger} 35%, {colors.pantry.line})'
            }
          },
          surface: {
            header: {
              value: 'color-mix(in oklab, {colors.pantry.canvas} 88%, white)'
            },
            rail: {
              value: 'color-mix(in oklab, {colors.pantry.canvas} 92%, white)'
            },
            tag: {
              value: 'color-mix(in oklab, {colors.pantry.accent} 8%, white)'
            }
          },
          overlay: {
            backdrop: {
              value: 'color-mix(in oklab, {colors.pantry.ink} 35%, transparent)'
            }
          },
          skeleton: {
            start: {
              value: 'color-mix(in oklab, {colors.pantry.line} 35%, white)'
            },
            middle: {
              value: 'color-mix(in oklab, {colors.pantry.line} 15%, white)'
            }
          }
        }
      },
      keyframes: {
        skeletonPulse: {
          '0%': { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-100% 0' }
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(0.375rem)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        crossfade: {
          from: { opacity: '0' },
          to: { opacity: '1' }
        }
      },
      animationStyles: {
        skeleton: {
          value: {
            animationName: 'skeletonPulse',
            animationDuration: 'skeleton',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite'
          }
        },
        fadeUp: {
          value: {
            animationName: 'fadeUp',
            animationDuration: 'fadeUp',
            animationTimingFunction: 'ease-out',
            animationFillMode: 'both'
          }
        },
        crossfade: {
          value: {
            animationName: 'crossfade',
            animationDuration: 'crossfade',
            animationTimingFunction: 'ease-out',
            animationFillMode: 'both'
          }
        }
      }
    }
  },

  outdir: 'styled-system',

  jsxFramework: 'react',

  strictTokens: true,
  strictPropertyValues: true,

  validation: 'error'
})
