import { css } from 'styled-system/css'

export const tagField = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  margin: '0',
  padding: '0',
  borderWidth: 'none',
  minInlineSize: '0'
})

export const tagFieldLegend = css({
  fontWeight: 'semibold',
  marginBlockEnd: '1'
})

export const tagOptionList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  maxBlockSize: '16rem',
  overflowY: 'auto'
})

export const tagOption = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  minBlockSize: 'touch'
})

export const tagQueryRow = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  alignItems: 'center',
  '& > :first-child': {
    flex: '1',
    minInlineSize: '12rem'
  }
})

export const tagStatus = css({
  margin: '0',
  color: 'fg.muted'
})

export const tagActions = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2'
})
