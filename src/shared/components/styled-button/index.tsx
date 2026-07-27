/**
 * @file index.tsx
 *
 * Input:    Base UI `Button`, Panda `cva`/`styled` factories
 * Output:   StyledButton component and shared `button` recipe
 * Position: Shared UI primitive; documented by index.stories.tsx,
 *           recipe also consumed via `src/styles/button.ts` / `ui.ts`
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./index.stories.tsx (stories for new/changed variants)
 *
 * Last synced props: visual, size, type, className, css, plus every Panda style prop
 */

import { Button as BaseButton } from '@base-ui/react/button'
import { cva } from 'styled-system/css'
import { styled } from 'styled-system/jsx'
import type { HTMLStyledProps } from 'styled-system/types'

/**
 * Shared button surface recipe.
 *
 * `visual` covers chrome roles (neutral, accent CTA, destructive).
 * `size` scales padding / min-height / font-size; `md` preserves the
 * previous single-size look (`minBlockSize: touch`, padding 2/4).
 *
 * Exported so callers can keep composing with `className={button()}`
 * or `button.raw()` (e.g. Link / Dialog) without switching to StyledButton.
 */
export const button = cva({
  base: {
    borderRadius: 'box',
    borderWidth: 'thin',
    borderStyle: 'solid',
    borderColor: 'border.default',
    background: 'bg.surface',
    color: 'fg.default',
    fontWeight: 'semibold',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    columnGap: '[0.25em]',
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
    },
    size: {
      xs: {
        minBlockSize: '[1.75rem]',
        fontSize: 'xs',
        paddingBlock: '1',
        paddingInline: '2'
      },
      sm: {
        minBlockSize: '[2.25rem]',
        fontSize: 'xs',
        paddingBlock: '1.5',
        paddingInline: '3'
      },
      md: {
        minBlockSize: 'touch',
        paddingBlock: '2',
        paddingInline: '4'
      },
      lg: {
        minBlockSize: '[3.5rem]',
        fontSize: 'md',
        paddingBlock: '3',
        paddingInline: '5'
      }
    }
  },
  defaultVariants: {
    visual: 'default',
    size: 'md'
  }
})

/**
 * Intentionally not exported. Consumers get `StyledButton` (or the `button`
 * recipe for className composition) instead of a bare styled Base UI Button.
 */
const RawButton = styled(BaseButton, button)

/**
 * NOT `StyledVariantProps`: that helper resolves to the recipe's variant record
 * alone and drops both Base UI / native button props and `JsxStyleProps`.
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
