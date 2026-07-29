/* oxlint-disable react/no-multi-comp */
// BasicLinkComponent は StyledLink を組み立てるための非公開中間コンポーネントで、
// 以下の JSDoc が述べる通り単一のプリミティブとして意図的に同居させている。
/**
 * @file index.tsx
 *
 * Input:    Panda `cva`/`styled` factories, TanStack Router `createLink`
 * Output:   StyledLink component
 * Position: Shared UI primitive; documented by index.stories.tsx, consumed by route components
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./index.stories.tsx (stories for new/changed variants)
 * - /src/routes/_protected.tsx (current consumer)
 *
 * Last synced props: to, search, params, visual, size, className, css, plus every Panda style prop
 */

import { createLink, LinkComponent } from '@tanstack/react-router'
import { cva } from 'styled-system/css'
import { styled } from 'styled-system/jsx'
import type { HTMLStyledProps } from 'styled-system/types'

/**
 * Base, visual, and size styles for the link surface.
 *
 * `visual` covers the recurring chrome roles in this app (header actions,
 * accent text links, muted secondary links, brand mark). Button-looking CTAs
 * stay on the `button` recipe via `className={button(...)}` composition.
 *
 * The hover rule sits behind `@media (any-hover: hover)` so touch devices never
 * latch sticky `:hover` after a tap. `:focus-visible` repeats the same treatment
 * so keyboard users get an identical affordance.
 */
const linkStyles = cva({
  base: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    textDecoration: 'none',
    fontFamily: '[inherit]',
    fontSize: '[inherit]',
    lineHeight: '[inherit]',
    fontWeight: '[inherit]',
    columnGap: '[0.25em]',
    paddingInline: '[0.75em]',
    borderRadius: 'box',
    cursor: 'pointer',
    transitionProperty: '[color, text-decoration]',
    touchAction: 'manipulation',
    '@media (any-hover: hover)': {
      '&:hover': {
        textDecoration: 'underline',
        textUnderlineOffset: '3px'
      }
    },
    '&:focus-visible': {
      textDecoration: 'underline',
      textUnderlineOffset: '3px'
    }
  },
  variants: {
    visual: {
      plain: {
        color: 'fg.default'
      },
      accent: {
        color: 'accent.solid',
        fontWeight: 'semibold'
      },
      muted: {
        color: 'fg.muted',
        fontSize: 'xs'
      },
      brand: {
        color: 'fg.default',
        fontWeight: 'bold',
        letterSpacing: 'wide'
      }
    },
    size: {
      xs: {
        minBlockSize: '[1.75rem]',
        '&::after': {
          content: '""',
          position: 'absolute',
          insetBlock: '[-0.5rem]',
          insetInline: '[-0.5rem]'
        }
      },
      sm: {
        minBlockSize: '[2.25rem]',
        '&::after': {
          content: '""',
          position: 'absolute',
          insetBlock: '[-0.25rem]',
          insetInline: '[-0.25rem]'
        }
      },
      md: {
        minBlockSize: '[3.0rem]'
      },
      lg: {
        minBlockSize: '[3.5rem]'
      }
    }
  },
  defaultVariants: {
    visual: 'plain',
    size: 'md'
  }
})

/**
 * Intentionally not exported. This is a bare styled anchor with no routing
 * props, so exposing it invites `<RawAnchorComponent to="/settings">`, which
 * type-errors on `to`. Consumers get `StyledLink` instead.
 */
const RawAnchorComponent = styled('a', linkStyles)

/**
 * NOT `StyledVariantProps`: that helper resolves to the recipe's variant record
 * alone (`{ visual?: ...; size?: ... }`) and drops both `ComponentProps<'a'>`
 * and `JsxStyleProps`. Since `createLink` and `LinkComponent` derive their
 * props from this component's `ComponentPropsWithoutRef`, that loss propagates
 * all the way to `StyledLink`: variants keep working while `className`,
 * `target`, `rel`, `css` and every style prop silently vanish from the public
 * type.
 *
 * `HTMLStyledProps` keeps the anchor attributes and the style props while still
 * carrying the recipe variants, so it is the correct input here.
 */
type BasicLinkComponentProps = HTMLStyledProps<typeof RawAnchorComponent>

/**
 * Deliberately a plain pass-through.
 *
 * NOT the `splitCssProps` + `css()` wrapper from the Panda docs: that pattern
 * exists for components that render a raw `<a>`, which cannot interpret style
 * props on its own. `RawAnchorComponent` is already a styled component, so it
 * performs the identical split internally and additionally folds the caller's
 * own `className` in via `cx(...)`. Repeating the split one layer up duplicates
 * the work, and assigning the computed class to `className` overwrites
 * `props.className` — silently dropping consumer styles in a way type checking
 * cannot catch.
 *
 * No `forwardRef`: React 19 delivers `ref` as an ordinary prop, and TanStack
 * passes its own `innerRef` down through props, so the ref still reaches the
 * DOM node through this spread. `preload="viewport"` depends on that.
 */
function BasicLinkComponent(props: BasicLinkComponentProps) {
  return <RawAnchorComponent {...props} />
}

/**
 * `createLink` supplies the runtime navigation behaviour; the explicit
 * `LinkComponent<...>` annotation on the re-export below is what restores
 * route-aware inference for `to`, `search` and `params`. Both halves are
 * required — this intermediate value is not usable on its own.
 * https://tanstack.com/router/latest/docs/guide/custom-link#link
 */
const CreatedLinkComponent = createLink(BasicLinkComponent)

/**
 * A route-aware anchor carrying the shared link styling.
 *
 * Accepts TanStack Router navigation props, the `visual` / `size` recipe
 * variants, and the full Panda style-prop surface. `className` is merged with
 * the recipe classes rather than replacing them, so callers can layer a
 * `css()` class on top.
 *
 * @example
 * ```
 * <StyledLink to="/settings">設定</StyledLink>
 * <StyledLink to="/settings" visual="plain" size="md">設定</StyledLink>
 * <StyledLink to="/" search={defaultBookmarkSearch} visual="brand">Pantry</StyledLink>
 * <StyledLink to=".." visual="accent">戻る</StyledLink>
 * <StyledLink to="/bookmarks/$id" params={{ id }} visual="muted">example.com</StyledLink>
 * ```
 */
export const StyledLink: LinkComponent<typeof BasicLinkComponent> = (props) => (
  <CreatedLinkComponent {...props} />
)
