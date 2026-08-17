import { cva } from 'styled-system/css'

/**
 * Shared button surface recipe.
 *
 * `visual` covers chrome roles (neutral, accent CTA, destructive).
 * `size` scales padding / min-height / font-size; `md` preserves the
 * previous single-size look (`minBlockSize: touch`, padding 2/4).
 *
 * Exported so callers can keep composing with `className={button()}`
 * or `button.raw()` (e.g. Link / Dialog) without switching to StyledButton.
 */
export const button = cva({
  base: {
    borderRadius: 'box',
    borderWidth: 'thin',
    borderStyle: 'solid',
    borderColor: 'border.default',
    background: 'bg.surface',
    color: 'fg.default',
    fontWeight: 'semibold',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    columnGap: '[0.25em]',
    alignItems: 'center',
    justifyContent: 'center',
    scale: '1',
    transitionProperty: 'scale, background-color, border-color, color, opacity',
    transitionDuration: 'hover',
    transitionTimingFunction: 'press',
    '@media (any-hover: hover)': {
      '&:hover:not(:disabled)': {
        borderColor: 'border.accent',
        background: 'accent.subtle'
      }
    },
    _active: {
      scale: '0.98'
    },
    _disabled: {
      opacity: '0.6',
      cursor: 'wait'
    }
  },
  variants: {
    visual: {
      default: {},
      accent: {
        borderColor: 'accent.solid',
        background: 'accent.solid',
        color: 'accent.fg',
        '@media (any-hover: hover)': {
          '&:hover:not(:disabled)': {
            borderColor: 'accent.solidHover',
            background: 'accent.solidHover',
            color: 'accent.fg'
          }
        }
      },
      danger: {
        borderColor: 'border.danger',
        color: 'danger.solid',
        background: 'bg.surface',
        '@media (any-hover: hover)': {
          '&:hover:not(:disabled)': {
            background: 'danger.surface',
            borderColor: 'border.danger',
            color: 'danger.solid'
          }
        }
      },
      toggle: {
        background: 'transparent',
        color: 'fg.muted',
        fontSize: 'xs',
        paddingInline: '3',
        '&[aria-pressed="true"]': {
          borderColor: 'accent.solid',
          background: 'accent.subtle',
          color: 'accent.solid'
        },
        '@media (any-hover: hover)': {
          '&:hover:not(:disabled):not([aria-pressed="true"])': {
            color: 'fg.default',
            borderColor: 'border.accent',
            background: 'transparent'
          }
        }
      },
      chip: {
        borderColor: 'border.accent',
        background: 'surface.tag',
        fontSize: 'xs',
        paddingInline: '3',
        columnGap: '1'
      }
    },
    size: {
      xs: {
        minBlockSize: '[1.75rem]',
        fontSize: 'xs',
        paddingBlock: '1',
        paddingInline: '2'
      },
      sm: {
        minBlockSize: '[2.25rem]',
        fontSize: 'xs',
        paddingBlock: '1.5',
        paddingInline: '3'
      },
      md: {
        minBlockSize: 'touch',
        paddingBlock: '2',
        paddingInline: '4'
      },
      lg: {
        minBlockSize: '[3.5rem]',
        fontSize: 'md',
        paddingBlock: '3',
        paddingInline: '5'
      }
    }
  },
  defaultVariants: {
    visual: 'default',
    size: 'md'
  }
})
