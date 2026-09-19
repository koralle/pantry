import { cva } from "styled-system/css";

/**
 * Ghost icon-only button surface for row actions, the header account icon,
 * and dialog close buttons. Always pair with a visible-none accessible
 * label (`aria-label`) — the icon itself is decorative.
 */
export const iconButton = cva({
  base: {
    "@media (any-hover: hover)": {
      "&:hover:not(:disabled)": {
        background: "surface.muted",
        color: "fg.default",
      },
    },
    _active: {
      scale: "0.92",
    },
    _disabled: {
      cursor: "wait",
      opacity: "0.5",
    },
    alignItems: "center",
    background: "transparent",
    borderColor: "transparent",
    borderRadius: "box",
    borderStyle: "solid",
    borderWidth: "thin",
    color: "fg.muted",
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: "0",
    justifyContent: "center",
    scale: "1",
    transitionDuration: "hover",
    transitionProperty: "scale, background-color, color, opacity",
    transitionTimingFunction: "press",
  },
  defaultVariants: {
    active: false,
    size: "md",
    tone: "default",
  },
  variants: {
    active: {
      false: {},
      true: {
        "@media (any-hover: hover)": {
          "&:hover:not(:disabled)": {
            background: "accent.subtle",
            color: "accent.solid",
          },
        },
        background: "accent.subtle",
        color: "accent.solid",
      },
    },
    size: {
      sm: {
        blockSize: "[1.5rem]",
        inlineSize: "[1.5rem]",
      },
      md: {
        blockSize: "[1.75rem]",
        inlineSize: "[1.75rem]",
      },
      lg: {
        blockSize: "[2.25rem]",
        inlineSize: "[2.25rem]",
      },
    },
    tone: {
      default: {},
      danger: {
        "@media (any-hover: hover)": {
          "&:hover:not(:disabled)": {
            background: "danger.surface",
            color: "danger.solid",
          },
        },
      },
    },
  },
});
