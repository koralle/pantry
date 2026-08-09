import { Input as AriaInput } from 'react-aria-components'
import { styled } from 'styled-system/jsx'
import type { HTMLStyledProps } from 'styled-system/types'

const RawInput = styled(AriaInput, {
  base: {
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
  }
})

type StyledInputProps = HTMLStyledProps<typeof RawInput>

export function StyledInput({ type = 'text', ...props }: StyledInputProps) {
  return (
    <RawInput
      type={type}
      {...props}
    />
  )
}
