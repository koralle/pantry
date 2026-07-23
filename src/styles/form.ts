import { css } from 'styled-system/css'

export const formControl = css({
  minBlockSize: 'touch',
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'box',
  paddingBlock: '2',
  paddingInline: '3',
  background: 'bg.surface'
})

export const formSummary = css({
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'danger.border',
  borderRadius: 'box',
  background: 'danger.surface',
  paddingBlock: '3.5',
  paddingInline: '4'
})

export const formSummaryTitle = css({
  margin: '0',
  marginBlockEnd: '1.5',
  fontWeight: 'semibold'
})

export const formSummaryList = css({
  margin: '0',
  paddingInlineStart: '5'
})

export const field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5'
})

export const fieldLabel = css({
  fontWeight: 'semibold'
})

export const fieldInput = css({
  minBlockSize: 'touch',
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'box',
  paddingBlock: '2',
  paddingInline: '3',
  background: 'bg.surface',
  width: 'full',
  boxSizing: 'border-box'
})

export const fieldUrlRow = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  '& > :first-child': {
    flex: '1',
    minInlineSize: '12rem'
  }
})

export const fieldError = css({
  margin: '0',
  color: 'danger.solid',
  fontSize: 'xs'
})
