import { css, cx } from 'styled-system/css'
import { visuallyHidden } from 'styled-system/patterns'

export { cx }

export const surface = css({
  borderWidth: 'thin',
  borderColor: 'border.default',
  borderRadius: 'box',
  background: 'bg.surface'
})

export const srOnly = visuallyHidden()

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
