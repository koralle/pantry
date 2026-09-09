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

import type { LinkComponent } from "@tanstack/react-router";
import { createLink } from "@tanstack/react-router";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";
import type { HTMLStyledProps } from "styled-system/types";

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
    "&:focus-visible": {
      textDecoration: "underline",
      textUnderlineOffset: "3px",
    },
    "@media (any-hover: hover)": {
      "&:hover": {
        textDecoration: "underline",
        textUnderlineOffset: "3px",
      },
    },
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: "box",
    columnGap: "[0.25em]",
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "[inherit]",
    fontSize: "[inherit]",
    fontWeight: "[inherit]",
    justifyContent: "center",
    lineHeight: "[inherit]",
    paddingInline: "[0.75em]",
    position: "relative",
    textDecoration: "none",
    touchAction: "manipulation",
    transitionDuration: "hover",
    transitionProperty: "[color, text-decoration]",
    transitionTimingFunction: "press",
  },
  defaultVariants: {
    size: "md",
    visual: "plain",
  },
  variants: {
    size: {
      lg: {
        minBlockSize: "[3.5rem]",
      },
      md: {
        minBlockSize: "[3.0rem]",
      },
      sm: {
        "&::after": {
          content: '""',
          insetBlock: "[-0.25rem]",
          insetInline: "[-0.25rem]",
          position: "absolute",
        },
        minBlockSize: "[2.25rem]",
      },
      xs: {
        "&::after": {
          content: '""',
          insetBlock: "[-0.5rem]",
          insetInline: "[-0.5rem]",
          position: "absolute",
        },
        minBlockSize: "[1.75rem]",
      },
    },
    visual: {
      accent: {
        color: "accent.solid",
        fontWeight: "semibold",
      },
      brand: {
        color: "fg.default",
        fontWeight: "bold",
        letterSpacing: "wide",
      },
      muted: {
        color: "fg.muted",
        fontSize: "xs",
      },
      plain: {
        color: "fg.default",
      },
    },
  },
});

/**
 * Intentionally not exported. This is a bare styled anchor with no routing
 * props, so exposing it invites `<RawAnchorComponent to="/settings">`, which
 * type-errors on `to`. Consumers get `StyledLink` instead.
 */
const RawAnchorComponent = styled("a", linkStyles);

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
type BasicLinkComponentProps = HTMLStyledProps<typeof RawAnchorComponent>;

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
const BasicLinkComponent = (props: BasicLinkComponentProps) => (
  <RawAnchorComponent {...props} />
);

/**
 * `createLink` supplies the runtime navigation behaviour; the explicit
 * `LinkComponent<...>` annotation on the re-export below is what restores
 * route-aware inference for `to`, `search` and `params`. Both halves are
 * required — this intermediate value is not usable on its own.
 * https://tanstack.com/router/latest/docs/guide/custom-link#link
 */
const CreatedLinkComponent = createLink(BasicLinkComponent);

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
 * <StyledLink to="/bookmarks" search={defaultBookmarkSearch} visual="brand">Pantry</StyledLink>
 * <StyledLink to=".." visual="accent">戻る</StyledLink>
 * <StyledLink to="/bookmarks/$id" params={{ id }} visual="muted">example.com</StyledLink>
 * ```
 */
export const StyledLink: LinkComponent<typeof BasicLinkComponent> = (props) => (
  <CreatedLinkComponent {...props} />
);
