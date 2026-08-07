import { styled } from 'styled-system/jsx'
import { HTMLStyledProps } from 'styled-system/types'

const RawLabel = styled('label', {
  base: {
    display: 'inline-flex',
    alignContent: 'center',
    color: 'fg.default',
    fontWeight: 'bold',
    fontSize: '0.825rem',
    gap: '0.25rem'
  }
})

type StyledLabelProps = HTMLStyledProps<typeof RawLabel>

export function StyledLabel(props: StyledLabelProps) {
  return <RawLabel {...props} />
}
