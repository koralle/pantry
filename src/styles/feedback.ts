import { css } from 'styled-system/css'

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
