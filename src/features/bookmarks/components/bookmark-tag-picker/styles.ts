import { css } from 'styled-system/css'

export const selectedRow = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  minInlineSize: '0',
  maxInlineSize: '100%'
})

export const chipButton = css({
  maxInlineSize: '100%',
  minInlineSize: '0',
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
  textAlign: 'start',
  justifyContent: 'flex-start',
  height: 'auto',
  minBlockSize: 'touch'
})

export const statusMessage = css({
  margin: '0',
  fontSize: 'xs',
  color: 'fg.muted'
})

export const panel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  minBlockSize: '0',
  flex: '1',
  overflow: 'hidden'
})

export const candidateList = css({
  margin: '0',
  padding: '0',
  outline: 'none',
  flex: '1',
  minBlockSize: '0',
  maxBlockSize: '16rem',
  overflow: 'auto'
})

export const candidateItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  minBlockSize: 'touch',
  paddingBlock: '2',
  paddingInline: '3',
  borderRadius: 'box',
  cursor: 'pointer',
  outline: 'none',
  minInlineSize: '0',
  '&[data-focused]': {
    background: 'accent.hover'
  },
  '&[data-selected="true"]': {
    background: 'accent.subtle',
    fontWeight: 'semibold'
  }
})

export const candidateName = css({
  flex: '1',
  minInlineSize: '0',
  overflowWrap: 'anywhere'
})

export const candidateState = css({
  flexShrink: '0',
  fontSize: 'xs',
  color: 'fg.muted'
})

export const checkSlot = css({
  inlineSize: '4',
  blockSize: '4',
  flexShrink: '0'
})

export const emptyState = css({
  paddingBlock: '2',
  paddingInline: '3',
  color: 'fg.muted',
  fontSize: 'xs'
})

export const popover = css({
  display: 'flex',
  flexDirection: 'column',
  minInlineSize: '[min(24rem, var(--trigger-width, 100%))]',
  maxInlineSize: '24rem',
  maxBlockSize: '24rem',
  overflow: 'hidden',
  zIndex: '20',
  margin: '0',
  padding: '2',
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'box',
  background: 'bg.surface',
  boxSizing: 'border-box'
})

export const sheetBackdrop = css({
  position: 'fixed',
  inset: '0',
  background: 'overlay.backdrop',
  zIndex: '20'
})

export const sheet = css({
  position: 'fixed',
  insetInline: '0',
  insetBlockEnd: '0',
  maxBlockSize: '85dvh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  margin: '0',
  paddingBlockStart: '4',
  paddingInline: '3',
  paddingBlockEnd: '5',
  borderWidth: 'none',
  borderBlockStartWidth: 'thin',
  borderBlockStartStyle: 'solid',
  borderBlockStartColor: 'border.default',
  borderTopLeftRadius: 'sheet',
  borderTopRightRadius: 'sheet',
  background: 'bg.canvas',
  boxSizing: 'border-box',
  width: 'full'
})

export const sheetHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  marginBlockEnd: '3',
  flexShrink: '0'
})

export const sheetTitle = css({
  margin: '0',
  fontSize: 'md2',
  fontWeight: 'bold'
})

export const sheetList = css({
  maxBlockSize: 'none'
})
