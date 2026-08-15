import { styled } from 'styled-system/jsx'
import { HTMLStyledProps } from 'styled-system/types'

const RawLabel = styled('label', {
  base: {
    display: 'inline-flex',
    alignContent: 'center',
    color: 'fg.default',
    fontWeight: 'semibold',
    fontSize: 'xs',
    gap: '0.25rem'
  }
})

type StyledLabelProps = HTMLStyledProps<typeof RawLabel>

export function StyledLabel(props: StyledLabelProps) {
  return <RawLabel {...props} />
}
