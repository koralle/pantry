import { css } from 'styled-system/css'

export const dialogBackdrop = css({
  position: 'fixed',
  inset: '0',
  background: 'overlay.backdrop'
})

export const dialog = css({
  position: 'fixed',
  inset: '0',
  margin: 'auto',
  maxInlineSize: '24rem',
  width: 'dialog-width',
  height: 'fit',
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'box',
  background: 'bg.surface',
  padding: '5',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '3'
})

export const dialogTitle = css({
  margin: '0',
  fontSize: 'md'
})

export const dialogActions = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
  alignItems: 'center'
})
