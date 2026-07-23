import { cva } from 'styled-system/css'

export const tagChip = cva({
  base: {
    borderWidth: 'thin',
    borderStyle: 'solid',
    borderColor: 'border.accent',
    borderRadius: 'box',
    background: 'surface.tag',
    color: 'fg.default'
  },
  variants: {
    visual: {
      interactive: {
        minBlockSize: 'touch',
        cursor: 'pointer',
        paddingBlock: '2',
        paddingInline: '3'
      },
      label: {
        minBlockSize: '0',
        paddingBlock: '0.5',
        paddingInline: '1.5',
        fontSize: '2xs',
        lineHeight: 'tight',
        cursor: 'default'
      },
      link: {
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center'
      }
    }
  },
  defaultVariants: {
    visual: 'interactive'
  }
})
