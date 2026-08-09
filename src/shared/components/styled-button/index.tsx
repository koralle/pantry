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
 * Last synced props: visual, size, type, className, css, plus every Panda style prop
 */

import { Button as AriaButton } from 'react-aria-components'
import { styled } from 'styled-system/jsx'
import type { HTMLStyledProps } from 'styled-system/types'

import { button } from '../../../styles/button'

/**
 * Intentionally not exported. Consumers get `StyledButton` (or the `button`
 * recipe for className composition) instead of a bare styled RAC Button.
 */
const RawButton = styled(AriaButton, button)

/**
 * NOT `StyledVariantProps`: that helper resolves to the recipe's variant record
 * alone and drops both React Aria / native button props and `JsxStyleProps`.
 * `HTMLStyledProps` keeps those attributes and style props while still
 * carrying the recipe variants.
 */
type StyledButtonProps = HTMLStyledProps<typeof RawButton>

/**
 * Deliberately a plain pass-through (plus a safe `type` default).
 *
 * NOT the `splitCssProps` + `css()` wrapper from the Panda docs: `RawButton`
 * is already a styled component, so it performs that split internally and
 * folds the caller's `className` via `cx(...)`. Repeating the split one layer
 * up would overwrite `props.className`.
 *
 * No `forwardRef`: React 19 delivers `ref` as an ordinary prop.
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
export function StyledButton({ type = 'button', ...props }: StyledButtonProps) {
  return (
    <RawButton
      type={type}
      {...props}
    />
  )
}
