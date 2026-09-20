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
        alignItems: "center",
        columnGap: "1.5",
        cursor: "default",
        display: "inline-flex",
        fontSize: "2xs",
        lineHeight: "tight",
        minBlockSize: "0",
        paddingBlock: "0.5",
        paddingInline: "1.5",
      },
      link: {
        alignItems: "center",
        columnGap: "1.5",
        display: "inline-flex",
        textDecoration: "none",
      },
    },
  },
});

export const tagDot = cva({
  base: {
    blockSize: "[0.5rem]",
    borderRadius: "[0.1875rem]",
    display: "inline-block",
    flexShrink: "0",
    inlineSize: "[0.5rem]",
  },
  defaultVariants: {
    tone: "slate",
  },
  variants: {
    tone: {
      teal: { background: "domain.teal" },
      blue: { background: "domain.blue" },
      violet: { background: "domain.violet" },
      pink: { background: "domain.pink" },
      green: { background: "domain.green" },
      orange: { background: "domain.orange" },
      yellow: { background: "domain.yellow" },
      slate: { background: "domain.slate" },
    },
  },
});
