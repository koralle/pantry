import { cva } from "styled-system/css";

export const kbd = cva({
  base: {
    background: "bg.surface",
    borderColor: "border.default",
    borderBlockEndWidth: "medium",
    borderRadius: "[0.25rem]",
    borderStyle: "solid",
    borderWidth: "thin",
    color: "fg.muted",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "mono",
    fontSize: "2xs",
    lineHeight: "1",
    minInlineSize: "[1.25rem]",
    paddingBlock: "0.5",
    paddingInline: "1.5",
  },
  defaultVariants: {
    tone: "default",
  },
  variants: {
    tone: {
      default: {},
      onAccent: {
        background: "color-mix(in oklab, {colors.accent.fg} 14%, transparent)",
        borderColor: "color-mix(in oklab, {colors.accent.fg} 32%, transparent)",
        color: "accent.fg",
      },
    },
  },
});
