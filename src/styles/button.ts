import { cva } from "styled-system/css";

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
    "@media (any-hover: hover)": {
      "&:hover:not(:disabled)": {
        background: "accent.subtle",
        borderColor: "border.accent",
      },
    },
    _active: {
      scale: "0.98",
    },
    _disabled: {
      cursor: "wait",
      opacity: "0.6",
    },
    alignItems: "center",
    background: "bg.surface",
    borderColor: "border.default",
    borderRadius: "box",
    borderStyle: "solid",
    borderWidth: "thin",
    color: "fg.default",
    columnGap: "[0.25em]",
    cursor: "pointer",
    display: "inline-flex",
    fontWeight: "semibold",
    justifyContent: "center",
    scale: "1",
    textDecoration: "none",
    transitionDuration: "hover",
    transitionProperty: "scale, background-color, border-color, color, opacity",
    transitionTimingFunction: "press",
  },
  defaultVariants: {
    size: "md",
    visual: "default",
  },
  variants: {
    size: {
      lg: {
        fontSize: "md",
        minBlockSize: "[3.5rem]",
        paddingBlock: "3",
        paddingInline: "5",
      },
      md: {
        minBlockSize: "touch",
        paddingBlock: "2",
        paddingInline: "4",
      },
      sm: {
        fontSize: "xs",
        minBlockSize: "[2.25rem]",
        paddingBlock: "1.5",
        paddingInline: "3",
      },
      xs: {
        fontSize: "xs",
        minBlockSize: "[1.75rem]",
        paddingBlock: "1",
        paddingInline: "2",
      },
    },
    visual: {
      accent: {
        "@media (any-hover: hover)": {
          "&:hover:not(:disabled)": {
            background: "accent.solidHover",
            borderColor: "accent.solidHover",
            color: "accent.fg",
          },
        },
        background: "accent.solid",
        borderColor: "accent.solid",
        color: "accent.fg",
      },
      chip: {
        background: "surface.tag",
        borderColor: "border.accent",
        columnGap: "1",
        fontSize: "xs",
        paddingInline: "3",
      },
      danger: {
        "@media (any-hover: hover)": {
          "&:hover:not(:disabled)": {
            background: "danger.surface",
            borderColor: "border.danger",
            color: "danger.solid",
          },
        },
        background: "bg.surface",
        borderColor: "border.danger",
        color: "danger.solid",
      },
      default: {},
      toggle: {
        '&[aria-pressed="true"]': {
          background: "accent.subtle",
          borderColor: "accent.solid",
          color: "accent.solid",
        },
        "@media (any-hover: hover)": {
          '&:hover:not(:disabled):not([aria-pressed="true"])': {
            background: "transparent",
            borderColor: "border.accent",
            color: "fg.default",
          },
        },
        background: "transparent",
        color: "fg.muted",
        fontSize: "xs",
        paddingInline: "3",
      },
    },
  },
});
