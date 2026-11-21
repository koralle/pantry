import { cva } from "styled-system/css";

/**
 * Ghost icon-only button surface for row actions, the header account icon,
 * and dialog close buttons. Always pair with a visible-none accessible
 * label (`aria-label`) — the icon itself is decorative.
 */
export const iconButton = cva({
  base: {
    "@media (hover: hover) and (pointer: fine)": {
      "&:hover:not(:disabled)": {
        background: "surface.muted",
        color: "fg.default",
      },
    },
    "@media (pointer: coarse)": {
      minBlockSize: "touch",
      minInlineSize: "touch",
    },
    "@media (prefers-reduced-motion: no-preference)": {
      _active: {
        scale: "0.95",
      },
    },
    _disabled: {
      cursor: "not-allowed",
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
    transitionProperty: "scale, background-color, border-color, color, opacity",
    transitionTimingFunction: "out",
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
        "@media (hover: hover) and (pointer: fine)": {
          "&:hover:not(:disabled)": {
            background: "accent.subtle",
            color: "accent.solid",
          },
        },
        background: "accent.subtle",
        borderColor: "border.accent",
        color: "accent.solid",
      },
    },
    size: {
      sm: {
        minBlockSize: "[2rem]",
        minInlineSize: "[2rem]",
      },
      md: {
        minBlockSize: "[2.25rem]",
        minInlineSize: "[2.25rem]",
      },
      lg: {
        minBlockSize: "[2.5rem]",
        minInlineSize: "[2.5rem]",
      },
    },
    tone: {
      default: {},
      danger: {
        "@media (hover: hover) and (pointer: fine)": {
          "&:hover:not(:disabled)": {
            background: "danger.surface",
            color: "danger.solid",
          },
        },
      },
    },
  },
});
