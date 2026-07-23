import { css } from 'styled-system/css'

export const workbench = css({
  maxInlineSize: '36rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '5'
})

export const workbenchNav = css({
  display: 'flex',
  flexWrap: 'wrap',
  rowGap: '3',
  columnGap: '5'
})

export const workbenchTitle = css({
  margin: '0',
  fontSize: 'title',
  fontWeight: 'bold',
  lineHeight: 'tight'
})

export const workbenchLead = css({
  margin: '0',
  color: 'fg.muted'
})

export const workbenchForm = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5'
})

export const workbenchFields = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  margin: '0',
  padding: '0',
  borderWidth: 'none',
  minInlineSize: '0'
})
