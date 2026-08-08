/**
 * @file index.tsx
 *
 * Input:    React Aria Components `Button`, Panda `styled` factory
 * Output:   StyledButton component
 * Position: Shared UI primitive; documented by index.stories.tsx
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./index.stories.tsx (stories for new/changed variants)
 *
 * Last synced props: visual, size, type, disabled, onClick, className, css,
 * plus every Panda style prop and React Aria Button prop
 */

import { Button as AriaButton } from 'react-aria-components/Button'
import { styled } from 'styled-system/jsx'
import type { HTMLStyledProps } from 'styled-system/types'

import { button } from '../../../styles/button'

/**
 * Intentionally not exported. Consumers get `StyledButton` (or the `button`
 * recipe for className composition) instead of a bare styled React Aria Button.
 */
const RawButton = styled(AriaButton, button)

/**
 * NOT `StyledVariantProps`: that helper resolves to the recipe's variant record
 * alone and drops both React Aria / native button props and `JsxStyleProps`.
 * `HTMLStyledProps` keeps those attributes and style props while still
 * carrying the recipe variants.
 *
 * `disabled` is re-declared because React Aria spells it `isDisabled`, but
 * existing call sites rely on the native `disabled` attribute spelling. It is
 * forwarded as `isDisabled` below. `onClick` already exists on the React Aria
 * Button props (as an alias of `onPress`) and flows through untouched.
 */
type StyledButtonProps = HTMLStyledProps<typeof RawButton> & {
  disabled?: boolean
}

/**
 * Deliberately a thin pass-through over the styled React Aria Button.
 *
 * `disabled` is mapped to React Aria's `isDisabled` (React Aria renders the
 * native `disabled` attribute from it, so `_disabled` recipe styles and CSS
 * `:disabled` selectors keep working).
 *
 * No `forwardRef`: React 19 delivers `ref` as an ordinary prop and the Panda
 * styled factory already forwards it.
 *
 * Defaults `type` to `"button"` when unset so forms do not accidentally submit.
 *
 * @example
 * ```
 * <StyledButton>キャンセル</StyledButton>
 * <StyledButton visual="accent" size="md">保存</StyledButton>
 * <StyledButton visual="danger" size="sm">削除</StyledButton>
 * <StyledButton type="submit" visual="accent">送信</StyledButton>
 * ```
 */
export function StyledButton({ type = 'button', disabled, ...props }: StyledButtonProps) {
  return (
    <RawButton
      type={type}
      isDisabled={disabled ?? false}
      {...props}
    />
  )
}
