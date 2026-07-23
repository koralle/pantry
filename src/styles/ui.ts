import { css, cva, cx } from 'styled-system/css'
import { visuallyHidden } from 'styled-system/patterns'

export { cx }

export const surface = css({
  borderWidth: 'thin',
  borderColor: 'border.default',
  borderRadius: 'box',
  background: 'bg.surface'
})

export const srOnly = visuallyHidden()

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

export const textLink = css({
  color: 'accent.solid',
  textDecoration: 'none',
  minBlockSize: 'touch',
  display: 'inline-flex',
  alignItems: 'center'
})

export const flash = css({
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'border.accent',
  borderRadius: 'box',
  background: 'accent.subtle',
  color: 'fg.default',
  paddingBlock: '3',
  paddingInline: '4'
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

export const skeleton = css({
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'box',
  backgroundImage:
    'linear-gradient(90deg, {colors.skeleton.start} 0%, {colors.skeleton.middle} 50%, {colors.skeleton.start} 100%)',
  backgroundSize: '200% 100%',
  animationStyle: 'skeleton',
  color: 'fg.muted',
  paddingBlock: '6',
  paddingInline: '4'
})

export const spinner = css({
  animationName: 'spin',
  animationDuration: 'spin',
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite'
})

export const stateBox = css({
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'box',
  paddingBlock: '6',
  paddingInline: '5',
  textAlign: 'center'
})

export const stateMessage = css({
  margin: '0',
  marginBlockEnd: '3',
  color: 'fg.muted'
})

export const stateErrorMessage = css({
  margin: '0',
  marginBlockEnd: '3',
  color: 'fg.default'
})

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
