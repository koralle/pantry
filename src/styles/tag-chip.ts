import { cva } from "styled-system/css";

export const tagChip = cva({
  base: {
    background: "surface.tag",
    borderColor: "border.accent",
    borderRadius: "box",
    borderStyle: "solid",
    borderWidth: "thin",
    color: "fg.default",
  },
  defaultVariants: {
    visual: "interactive",
  },
  variants: {
    visual: {
      interactive: {
        cursor: "pointer",
        minBlockSize: "touch",
        paddingBlock: "2",
        paddingInline: "3",
      },
      label: {
        cursor: "default",
        fontSize: "2xs",
        lineHeight: "tight",
        minBlockSize: "0",
        paddingBlock: "0.5",
        paddingInline: "1.5",
      },
      link: {
        alignItems: "center",
        display: "inline-flex",
        textDecoration: "none",
      },
    },
  },
});
