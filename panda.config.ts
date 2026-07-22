import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: false,

  include: ['./src/**/*.{ts,tsx}'],

  exclude: [],

  presets: ['@pandacss/preset-base'],

  outdir: 'styled-system',

  jsxFramework: 'react',

  strictTokens: true,
  strictPropertyValues: true,

  validation: 'error',

  utilities: {
    extend: {
      tabular: {
        className: 'tabular',
        values: ['nums'],
        transform(value: string) {
          if (value !== 'nums') {
            return {}
          }
          return { fontVariantNumeric: 'tabular-nums' }
        }
      }
    }
  },

  theme: {
    extend: {
      breakpoints: {
        sm: '40rem',
        md: '64rem'
      },

      tokens: {
        colors: {
          white: { value: '#ffffff' },
          gray: {
            50: { value: '#f7f9fb' },
            100: { value: '#eef1f5' },
            200: { value: '#dfe4ea' },
            300: { value: '#c6cdd6' },
            400: { value: '#98a3b0' },
            500: { value: '#6e7a89' },
            600: { value: '#525e6d' },
            700: { value: '#3c4754' },
            800: { value: '#27303b' },
            900: { value: '#171d26' },
            950: { value: '#0e1219' }
          },
          cobalt: {
            50: { value: '#eef3ff' },
            100: { value: '#dfe8ff' },
            200: { value: '#c6d4fe' },
            300: { value: '#9eb7fb' },
            400: { value: '#6e92f6' },
            500: { value: '#4369ee' },
            600: { value: '#2b4fe2' },
            700: { value: '#2340bd' },
            800: { value: '#213799' },
            900: { value: '#21337a' },
            950: { value: '#14204b' }
          },
          red: {
            50: { value: '#fbf1f1' },
            100: { value: '#f7e2e2' },
            200: { value: '#f0c8c8' },
            300: { value: '#e5a0a0' },
            400: { value: '#d57070' },
            500: { value: '#c04848' },
            600: { value: '#a32e2e' },
            700: { value: '#872626' },
            800: { value: '#702323' },
            900: { value: '#5e2121' },
            950: { value: '#330f0f' }
          }
        },
        fonts: {
          sans: {
            value:
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif'
          },
          mono: {
            value: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
          }
        },
        fontSizes: {
          metadata: { value: '0.75rem' },
          label: { value: '0.8125rem' },
          body: { value: '0.875rem' },
          title: { value: '1.125rem' },
          display: { value: '1.5rem' },
          displayLg: { value: '2rem' }
        },
        fontWeights: {
          normal: { value: '400' },
          medium: { value: '500' },
          semibold: { value: '600' },
          bold: { value: '700' }
        },
        lineHeights: {
          compact: { value: '1.25' },
          normal: { value: '1.5' },
          relaxed: { value: '1.7' }
        },
        letterSpacings: {
          tight: { value: '-0.01em' },
          normal: { value: '0em' },
          wide: { value: '0.06em' }
        },
        spacing: {
          0: { value: '0rem' },
          1: { value: '0.25rem' },
          2: { value: '0.5rem' },
          3: { value: '0.75rem' },
          4: { value: '1rem' },
          5: { value: '1.25rem' },
          6: { value: '1.5rem' },
          8: { value: '2rem' },
          10: { value: '2.5rem' },
          12: { value: '3rem' },
          16: { value: '4rem' },
          20: { value: '5rem' },
          24: { value: '6rem' }
        },
        sizes: {
          touch: { value: '2.75rem' },
          icon: {
            sm: { value: '1rem' },
            md: { value: '1.25rem' },
            lg: { value: '1.5rem' }
          },
          control: {
            sm: { value: '2rem' },
            md: { value: '2.25rem' }
          },
          rail: { value: '16rem' },
          readable: { value: '40rem' },
          form: { value: '28rem' },
          dialog: { value: '26rem' },
          full: { value: '100%' },
          viewport: { value: '100dvh' }
        },
        radii: {
          control: { value: '0.375rem' },
          panel: { value: '0.5rem' },
          full: { value: '9999px' }
        },
        borderWidths: {
          hairline: { value: '1px' },
          emphasis: { value: '2px' }
        },
        zIndex: {
          raised: { value: '10' },
          overlay: { value: '40' },
          dialog: { value: '50' }
        },
        opacity: {
          0: { value: '0' },
          40: { value: '0.4' },
          50: { value: '0.5' },
          100: { value: '1' }
        },
        shadows: {
          raised: {
            value: '0 1px 2px {colors.gray.950/12}, 0 8px 24px {colors.gray.950/16}'
          }
        },
        durations: {
          fast: { value: '120ms' },
          normal: { value: '200ms' },
          enter: { value: '240ms' },
          skeleton: { value: '1600ms' },
          spinner: { value: '750ms' }
        },
        easings: {
          standard: { value: 'cubic-bezier(0.25, 0.1, 0.25, 1)' },
          out: { value: 'cubic-bezier(0.16, 1, 0.3, 1)' },
          inOut: { value: 'cubic-bezier(0.65, 0, 0.35, 1)' }
        },
        animations: {
          spin: { value: 'spin {durations.spinner} linear infinite' },
          pulse: { value: 'pulse {durations.skeleton} {easings.inOut} infinite' },
          'fade-up': { value: 'fade-up {durations.enter} {easings.out} both' },
          fade: { value: 'fade {durations.enter} {easings.out} both' }
        }
      },

      keyframes: {
        spin: {
          to: { transform: 'rotate(360deg)' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' }
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(0.25rem)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        fade: {
          from: { opacity: '0' },
          to: { opacity: '1' }
        }
      },

      semanticTokens: {
        colors: {
          canvas: { value: '{colors.gray.100}' },
          surface: {
            DEFAULT: { value: '{colors.white}' },
            raised: { value: '{colors.white}' }
          },
          text: {
            DEFAULT: { value: '{colors.gray.900}' },
            muted: { value: '{colors.gray.600}' }
          },
          border: {
            DEFAULT: { value: '{colors.gray.200}' },
            strong: { value: '{colors.gray.500}' }
          },
          accent: {
            DEFAULT: { value: '{colors.cobalt.600}' },
            subtle: { value: '{colors.cobalt.50}' },
            contrast: { value: '{colors.white}' }
          },
          danger: {
            DEFAULT: { value: '{colors.red.600}' },
            subtle: { value: '{colors.red.50}' }
          },
          overlay: { value: '{colors.gray.950}' }
        },
        spacing: {
          inline: {
            xs: { value: '{spacing.1}' },
            sm: { value: '{spacing.2}' },
            md: { value: '{spacing.3}' },
            lg: { value: '{spacing.4}' },
            xl: { value: '{spacing.6}' }
          },
          control: {
            xs: { value: '{spacing.1}' },
            sm: { value: '{spacing.2}' },
            md: { value: '{spacing.3}' },
            lg: { value: '{spacing.4}' }
          },
          section: {
            xs: { value: '{spacing.4}' },
            sm: { value: '{spacing.6}' },
            md: { value: '{spacing.8}' },
            lg: { value: '{spacing.12}' },
            xl: { value: '{spacing.16}' }
          },
          page: {
            value: { base: '{spacing.4}', md: '{spacing.6}' }
          }
        }
      }
    }
  }
})
