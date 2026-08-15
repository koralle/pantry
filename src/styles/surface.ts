import { css } from 'styled-system/css'

export const surface = css({
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'box',
  background: 'bg.surface'
})

export const interactiveSurface = css({
  transitionProperty: 'border-color, background-color',
  transitionDuration: 'hover',
  transitionTimingFunction: 'press',
  '@media (any-hover: hover)': {
    '&:hover': {
      borderColor: 'border.accent',
      background: 'accent.hover'
    }
  }
})
