import { cva } from "styled-system/css";

export const tagChip = cva({
  base: {
    background: "surface.muted",
    borderColor: "border.default",
    borderRadius: "full",
    borderStyle: "solid",
    borderWidth: "thin",
    color: "fg.default",
    transitionDuration: "hover",
    transitionProperty: "background-color, border-color",
    transitionTimingFunction: "out",
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
        fontWeight: "medium",
        lineHeight: "tight",
        minBlockSize: "0",
        paddingBlock: "1",
        paddingInline: "2",
      },
      link: {
        "@media (hover: hover) and (pointer: fine)": {
          "&:hover": {
            background: "accent.subtle",
            borderColor: "border.accent",
          },
        },
        alignItems: "center",
        columnGap: "1.5",
        display: "inline-flex",
        fontSize: "2xs",
        fontWeight: "medium",
        minBlockSize: "[1.75rem]",
        paddingBlock: "1",
        paddingInline: "2.5",
        textDecoration: "none",
      },
    },
  },
});

export const tagDot = cva({
  base: {
    blockSize: "[0.5rem]",
    borderRadius: "full",
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
