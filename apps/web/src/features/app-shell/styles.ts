import { css, cva } from "styled-system/css";

/**
 * App-shell surfaces: top bar, workbench bar, navigation rail,
 * bottom tabs, and the mobile quick-add FAB.
 */

export const topbar = css({
  alignItems: "center",
  background: "bg.surface",
  borderBlockEndColor: "border.default",
  borderBlockEndStyle: "solid",
  borderBlockEndWidth: "thin",
  columnGap: "3",
  display: "flex",
  flexShrink: "0",
  justifyContent: "space-between",
  minBlockSize: "[3.5rem]",
  paddingBlock: "1.5",
  paddingInline: { base: "3.5", md: "5" },
  position: "relative",
  zIndex: "20",
});

export const topbarActions = css({
  alignItems: "center",
  columnGap: "2.5",
  display: "flex",
  marginInlineStart: "auto",
});

export const desktopOnlyWrap = css({
  display: "none",
  md: {
    display: "inline-flex",
  },
});

export const wordmark = css({
  "@media (hover: hover) and (pointer: fine)": {
    "&:hover": {
      color: "accent.solid",
    },
  },
  "@media (pointer: coarse)": {
    minBlockSize: "touch",
  },
  alignItems: "center",
  borderRadius: "box",
  color: "fg.default",
  columnGap: "2",
  display: "inline-flex",
  fontSize: "sm",
  fontWeight: "bold",
  letterSpacing: "[-0.01em]",
  minBlockSize: "[2.25rem]",
  paddingInline: "1",
  textDecoration: "none",
  transitionDuration: "hover",
  transitionProperty: "color",
  transitionTimingFunction: "out",
});

export const wordmarkBadge = css({
  alignItems: "center",
  background:
    "linear-gradient(150deg, token(colors.pantry.brandStart), token(colors.pantry.brandEnd))",
  blockSize: "[1.75rem]",
  borderRadius: "box",
  color: "white",
  display: "inline-flex",
  flexShrink: "0",
  inlineSize: "[1.75rem]",
  justifyContent: "center",
});

/**
 * 集中フロー（フォーム・クイック追加）の本体。Layout の main に合わせて伸縮し、
 * 中身（formWrap）がスクロールする。
 */
export const workbenchScreen = css({
  background: "bg.canvas",
  display: "flex",
  flex: "1",
  flexDirection: "column",
  minBlockSize: "0",
});

/**
 * 集中フロー（フォーム・クイック追加）の専用トップバー。
 * シェルの代わりに backlink + wordmark + アカウントアイコンだけを持つ。
 * モバイルは wordmark の代わりに画面名を中央に置く。
 */
export const workbenchBar = css({
  alignItems: "center",
  background: "bg.surface",
  borderBlockEndColor: "border.default",
  borderBlockEndStyle: "solid",
  borderBlockEndWidth: "thin",
  columnGap: "3",
  display: "flex",
  flexShrink: "0",
  minBlockSize: "[3.5rem]",
  paddingBlock: "1.5",
  paddingInline: { base: "3.5", md: "5" },
  position: "relative",
  zIndex: "20",
});

export const workbenchWordmark = css({
  display: "none",
  marginInlineStart: "2",
  md: {
    display: "inline-flex",
  },
});

export const workbenchBarFlex = css({
  flex: "1",
});

export const workbenchBarTitle = css({
  fontSize: "sm",
  fontWeight: "bold",
  md: {
    display: "none",
  },
});

export const shellRoot = css({
  blockSize: "100dvh",
  display: "flex",
  flexDirection: "column",
});

export const skipLink = css({
  "&:not(:focus)": {
    borderWidth: "0",
    clip: "rect(0, 0, 0, 0)",
    height: "1px",
    margin: "-1px",
    overflow: "hidden",
    padding: "0",
    whiteSpace: "nowrap",
    width: "1px",
  },
  background: "bg.surface",
  borderColor: "accent.solid",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "medium",
  color: "fg.default",
  fontSize: "xs",
  fontWeight: "semibold",
  insetBlockStart: "3",
  insetInlineStart: "3",
  paddingBlock: "2",
  paddingInline: "3.5",
  position: "absolute",
  textDecoration: "none",
  zIndex: "50",
});

export const shellBody = css({
  display: "flex",
  flex: "1",
  minBlockSize: "0",
});

export const rail = css({
  background: "bg.surface",
  borderInlineEndColor: "border.default",
  borderInlineEndStyle: "solid",
  borderInlineEndWidth: "thin",
  display: "none",
  flexDirection: "column",
  flexShrink: "0",
  inlineSize: "[14.5rem]",
  md: {
    display: "flex",
  },
  overflowY: "auto",
  overscrollBehavior: "contain",
  paddingBlock: "4",
  paddingInline: "3",
  rowGap: "1",
});

export const railItem = cva({
  base: {
    "@media (hover: hover) and (pointer: fine)": {
      "&:hover": {
        background: "surface.muted",
        color: "fg.default",
      },
    },
    alignItems: "center",
    borderRadius: "[0.5rem]",
    color: "fg.muted",
    columnGap: "2.5",
    display: "flex",
    fontSize: "xs",
    fontWeight: "medium",
    minBlockSize: "[2.25rem]",
    minInlineSize: "0",
    paddingBlock: "1.5",
    paddingInline: "2.5",
    textDecoration: "none",
    transitionDuration: "hover",
    transitionProperty: "background-color, color",
    transitionTimingFunction: "out",
  },
  defaultVariants: {
    active: false,
  },
  variants: {
    active: {
      false: {},
      true: {
        "& .pantry-rail-count": {
          color: "accent.solid",
        },
        "& .pantry-rail-icon": {
          color: "accent.solid",
        },
        "@media (hover: hover) and (pointer: fine)": {
          "&:hover": {
            background: "accent.subtle",
            color: "accent.solid",
          },
        },
        background: "accent.subtle",
        color: "accent.solid",
        fontWeight: "semibold",
      },
    },
  },
});

export const railIcon = css({
  blockSize: "[1rem]",
  color: "fg.muted",
  flexShrink: "0",
  inlineSize: "[1rem]",
});

export const railLabel = css({
  flex: "1",
  minInlineSize: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const railCount = css({
  color: "fg.faint",
  flexShrink: "0",
  fontFamily: "mono",
  fontSize: "2xs",
  fontVariantNumeric: "tabular-nums",
  marginInlineStart: "auto",
});

export const railSectionRow = css({
  alignItems: "center",
  display: "flex",
  justifyContent: "space-between",
  marginBlockStart: "3.5",
  paddingBlockEnd: "1",
  paddingInline: "2.5",
});

export const railSection = css({
  color: "fg.muted",
  fontSize: "2xs",
  fontWeight: "bold",
  letterSpacing: "[0.04em]",
  margin: "0",
});

export const railManageLink = css({
  "@media (hover: hover) and (pointer: fine)": {
    "&:hover": {
      textDecoration: "underline",
      textUnderlineOffset: "3px",
    },
  },
  borderRadius: "box",
  color: "accent.solid",
  fontSize: "2xs",
  fontWeight: "semibold",
  paddingBlock: "0.5",
  paddingInline: "1.5",
  textDecoration: "none",
});

export const railError = css({
  color: "fg.muted",
  fontSize: "2xs",
  margin: "0",
  paddingBlock: "2",
  paddingInline: "2.5",
});

export const shellMain = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  minBlockSize: "0",
  minInlineSize: "0",
  overflowY: "auto",
  overscrollBehavior: "contain",
  scrollPaddingBottom: "[calc(4.5rem + env(safe-area-inset-bottom, 0px))]",
});

export const bottomTabs = css({
  alignItems: "center",
  background: "bg.surface",
  borderBlockStartColor: "border.default",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "thin",
  display: "grid",
  flexShrink: "0",
  gridTemplateColumns: "1fr 1fr auto 1fr 1fr",
  justifyItems: "center",
  md: {
    display: "none",
  },
  minBlockSize: "[3.75rem]",
  paddingBlockEnd: "[max(0.5rem, env(safe-area-inset-bottom, 0px))]",
  paddingBlockStart: "1",
  paddingInline: "2",
  position: "relative",
  zIndex: "20",
});

export const tabItem = cva({
  base: {
    alignItems: "center",
    borderRadius: "box",
    color: "fg.muted",
    display: "flex",
    flexDirection: "column",
    fontSize: "2xs",
    fontWeight: "medium",
    justifyContent: "center",
    lineHeight: "tight",
    minBlockSize: "touch",
    minInlineSize: "touch",
    paddingBlock: "1",
    paddingInline: "2",
    rowGap: "1",
    textDecoration: "none",
    transitionDuration: "hover",
    transitionProperty: "color, background-color",
    transitionTimingFunction: "out",
    whiteSpace: "nowrap",
  },
  defaultVariants: {
    active: false,
  },
  variants: {
    active: {
      false: {},
      true: {
        color: "accent.solid",
        fontWeight: "bold",
      },
    },
  },
});

export const fab = css({
  "@media (prefers-reduced-motion: no-preference)": {
    _active: {
      scale: "0.94",
    },
  },
  alignItems: "center",
  background: "accent.solid",
  blockSize: "[3rem]",
  borderColor: "bg.surface",
  borderRadius: "full",
  borderStyle: "solid",
  borderWidth: "thick",
  boxShadow: "fab",
  color: "accent.fg",
  display: "flex",
  inlineSize: "[3rem]",
  justifyContent: "center",
  marginBlockStart: "[-1.25rem]",
  scale: "1",
  textDecoration: "none",
  transitionDuration: "hover",
  transitionProperty: "scale, background-color",
  transitionTimingFunction: "out",
});
