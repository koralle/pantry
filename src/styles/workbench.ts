import { css } from 'styled-system/css'

import { pageLead, pageTitle } from './type'

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

export const workbenchTitle = pageTitle

export const workbenchLead = pageLead

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
