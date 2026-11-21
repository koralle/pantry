import { cva } from "styled-system/css";

/**
 * Shared button surface recipe.
 *
 * `visual` covers chrome roles (neutral, accent CTA, destructive).
 * `size` scales padding / min-height / font-size; `md` preserves the
 * standard touch-friendly height (`minBlockSize: touch`, padding 2/4).
 *
 * Exported so callers can keep composing with `className={button()}`
 * or `button.raw()` (e.g. Link / Dialog) without switching to StyledButton.
 */
export const button = cva({
  base: {
    "@media (hover: hover) and (pointer: fine)": {
      "&:hover:not(:disabled)": {
        background: "surface.muted",
        borderColor: "fg.muted",
      },
    },
    "@media (pointer: coarse)": {
      minBlockSize: "touch",
    },
    "@media (prefers-reduced-motion: no-preference)": {
      _active: {
        scale: "0.97",
      },
    },
    _disabled: {
      cursor: "not-allowed",
      opacity: "0.55",
    },
    alignItems: "center",
    background: "bg.surface",
    borderColor: "border.control",
    borderRadius: "box",
    borderStyle: "solid",
    borderWidth: "thin",
    color: "fg.default",
    columnGap: "[0.375em]",
    cursor: "pointer",
    display: "inline-flex",
    fontWeight: "semibold",
    justifyContent: "center",
    lineHeight: "tight",
    scale: "1",
    textDecoration: "none",
    transitionDuration: "hover",
    transitionProperty: "scale, background-color, border-color, color, opacity",
    transitionTimingFunction: "out",
    whiteSpace: "nowrap",
  },
  defaultVariants: {
    size: "md",
    visual: "default",
  },
  variants: {
    size: {
      lg: {
        fontSize: "md",
        minBlockSize: "[3.25rem]",
        paddingBlock: "3",
        paddingInline: "5",
      },
      md: {
        fontSize: "xs",
        minBlockSize: "touch",
        paddingBlock: "2",
        paddingInline: "4",
      },
      sm: {
        fontSize: "xs",
        minBlockSize: "[2.25rem]",
        paddingBlock: "1.5",
        paddingInline: "3.5",
      },
      xs: {
        fontSize: "xs",
        minBlockSize: "[2rem]",
        paddingBlock: "1",
        paddingInline: "2.5",
      },
    },
    visual: {
      accent: {
        "@media (hover: hover) and (pointer: fine)": {
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
        columnGap: "1.5",
        fontSize: "xs",
        paddingInline: "3",
      },
      ghost: {
        "@media (hover: hover) and (pointer: fine)": {
          "&:hover:not(:disabled)": {
            background: "surface.muted",
            borderColor: "transparent",
          },
        },
        background: "transparent",
        borderColor: "transparent",
      },
      quiet: {
        "@media (hover: hover) and (pointer: fine)": {
          "&:hover:not(:disabled)": {
            background: "accent.subtle",
            borderColor: "transparent",
          },
        },
        background: "transparent",
        borderColor: "transparent",
        color: "accent.solid",
      },
      danger: {
        "@media (hover: hover) and (pointer: fine)": {
          "&:hover:not(:disabled)": {
            background: "danger.surface",
            borderColor: "danger.solid",
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
        "@media (hover: hover) and (pointer: fine)": {
          '&:hover:not(:disabled):not([aria-pressed="true"])': {
            background: "surface.muted",
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
