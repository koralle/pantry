import { cva } from 'styled-system/css'

export const button = cva({
  base: {
    minBlockSize: 'touch',
    borderRadius: 'box',
    borderWidth: 'thin',
    borderStyle: 'solid',
    borderColor: 'border.default',
    background: 'bg.surface',
    color: 'fg.default',
    fontWeight: 'semibold',
    paddingBlock: '2',
    paddingInline: '4',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    }
  },
  defaultVariants: {
    visual: 'default'
  }
})
