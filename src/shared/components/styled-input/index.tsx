import type { ChangeEvent } from 'react'
import { Input as AriaInput } from 'react-aria-components/Input'
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

/**
 * `HTMLStyledProps` keeps the native input attributes (including `disabled`,
 * `value`, `onChange`) and the Panda style props. `onValueChange` is re-added
 * because it is the Base UI spelling that existing call sites rely on; React
 * Aria's `Input` only exposes the native `onChange`.
 */
type StyledInputProps = HTMLStyledProps<typeof RawInput> & {
  onValueChange?: (value: string) => void
}

/**
 * Thin adapter over the styled React Aria `Input`.
 *
 * Maps the Base UI-style `onValueChange(value)` callback onto the native
 * `onChange` event so existing controlled call sites keep working unchanged.
 * Any caller-provided `onChange` is invoked as well.
 *
 * Defaults `type` to `"text"` when unset.
 */
export function StyledInput({
  type = 'text',
  onValueChange,
  onChange,
  ...props
}: StyledInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event)
    onValueChange?.(event.currentTarget.value)
  }

  return (
    <RawInput
      type={type}
      onChange={handleChange}
      {...props}
    />
  )
}
