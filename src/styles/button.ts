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
    transitionProperty: 'transform, background-color, border-color, color, opacity',
    transitionDuration: 'press',
    transitionTimingFunction: 'press',
    _active: {
      transform: 'scale(0.98)'
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
        color: 'accent.fg'
      },
      danger: {
        borderColor: 'border.danger',
        color: 'danger.solid',
        background: 'bg.surface'
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
