import { css } from 'styled-system/css'

export const dataTableWrap = css({
  inlineSize: '100%',
  minInlineSize: '0'
})

export const dataTable = css({
  width: 'full',
  borderCollapse: 'collapse',
  tableLayout: 'fixed'
})

export const dataTableCell = css({
  borderBlockEndWidth: 'thin',
  borderBlockEndStyle: 'solid',
  borderBlockEndColor: 'border.default',
  paddingBlock: '2.5',
  paddingInline: '3',
  textAlign: 'start',
  verticalAlign: 'middle'
})

export const dataTableHeadCell = css({
  color: 'fg.muted',
  fontSize: '2xs',
  fontWeight: 'semibold',
  letterSpacing: 'wide',
  paddingBlock: '2',
  whiteSpace: 'nowrap'
})

export const dataTableRow = css({
  position: 'relative',
  background: 'bg.surface',
  transitionProperty: 'background-color',
  transitionDuration: 'hover',
  transitionTimingFunction: 'press',
  '@media (any-hover: hover)': {
    '&:hover': {
      background: 'accent.hover'
    }
  }
})

export const dataTableRowLink = css({
  color: 'fg.default',
  fontWeight: 'semibold',
  textDecoration: 'none',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: '0',
    zIndex: '1'
  },
  _focusVisible: {
    outline: 'none'
  },
  '&:focus-visible::after': {
    outlineWidth: 'medium',
    outlineStyle: 'solid',
    outlineColor: 'accent.solid',
    outlineOffset: '-2px'
  },
  '@media (any-hover: hover)': {
    '&:hover': {
      textDecoration: 'none'
    }
  }
})

export const dataTableNested = css({
  position: 'relative',
  zIndex: '2'
})
