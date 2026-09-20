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
    fontFamily: "mono",
    fontSize: "[0.625rem]",
    lineHeight: "1",
    paddingBlock: "[0.0625rem]",
    paddingInline: "[0.3125rem]",
  },
  defaultVariants: {
    tone: "default",
  },
  variants: {
    tone: {
      default: {},
      onAccent: {
        background: "transparent",
        borderColor: "[rgba(255,255,255,0.35)]",
        color: "[rgba(255,255,255,0.85)]",
      },
    },
  },
});
