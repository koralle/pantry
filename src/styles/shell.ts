import { css, cva } from "styled-system/css";

/**
 * App-shell surfaces: top bar, command bar, navigation rail, bottom tabs,
 * and the mobile quick-add FAB. Dimensions follow the approved mock
 * (mocks/2026-09-16-directions) — keep arbitrary values aligned with it.
 */

export const topbar = css({
  alignItems: "center",
  background: "bg.surface",
  blockSize: "[3.25rem]",
  borderBlockEndColor: "border.default",
  borderBlockEndStyle: "solid",
  borderBlockEndWidth: "thin",
  columnGap: "3.5",
  display: "flex",
  flexShrink: "0",
  paddingInline: "4",
});

export const wordmark = css({
  color: "fg.default",
  fontSize: "sm",
  fontWeight: "extrabold",
  letterSpacing: "[0.04em]",
  textDecoration: "none",
});

export const commandBar = css({
  _focusWithin: {
    borderColor: "border.accent",
  },
  alignItems: "center",
  background: "surface.muted",
  borderColor: "border.default",
  borderRadius: "[0.5625rem]",
  borderStyle: "solid",
  borderWidth: "thin",
  color: "fg.faint",
  columnGap: "2.5",
  display: "flex",
  flex: "1",
  fontSize: "[0.8125rem]",
  marginInline: "auto",
  maxInlineSize: "[38.75rem]",
  paddingBlock: "[0.4375rem]",
  paddingInline: "3",
});

export const commandInput = css({
  _focusVisible: {
    outline: "none",
  },
  background: "transparent",
  border: "none",
  color: "fg.default",
  flex: "1",
  font: "inherit",
  minInlineSize: "0",
});

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
  borderWidth: "thin",
  color: "fg.default",
  insetBlockStart: "4",
  insetInlineStart: "4",
  paddingBlock: "2",
  paddingInline: "3",
  position: "absolute",
  textDecoration: "none",
  zIndex: "10",
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
  md: {
    display: "flex",
  },
  overflowY: "auto",
  paddingBlock: "3.5",
  paddingInline: "2.5",
  rowGap: "0.5",
  width: "[13.5rem]",
});

export const railItem = cva({
  base: {
    "@media (any-hover: hover)": {
      "&:hover": {
        background: "surface.muted",
        color: "fg.default",
      },
    },
    alignItems: "center",
    borderRadius: "[0.4375rem]",
    color: "fg.muted",
    columnGap: "[0.5625rem]",
    display: "flex",
    fontSize: "[0.8125rem]",
    paddingBlock: "1.5",
    paddingInline: "2.5",
    textDecoration: "none",
    transitionDuration: "hover",
    transitionProperty: "background-color, color",
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
        background: "accent.subtle",
        color: "accent.solid",
        fontWeight: "bold",
      },
    },
  },
});

export const railIcon = css({
  blockSize: "[0.9375rem]",
  color: "fg.faint",
  flexShrink: "0",
  inlineSize: "[0.9375rem]",
});

export const railCount = css({
  color: "fg.faint",
  fontFamily: "mono",
  fontSize: "[0.6875rem]",
  marginInlineStart: "auto",
});

export const railSection = css({
  color: "fg.faint",
  fontSize: "[0.625rem]",
  fontWeight: "bold",
  letterSpacing: "[0.08em]",
  paddingBlockEnd: "1",
  paddingBlockStart: "2.5",
  paddingInline: "2.5",
});

export const shellMain = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  minBlockSize: "0",
  minInlineSize: "0",
  overflowY: "auto",
});

export const bottomTabs = css({
  alignItems: "center",
  background: "bg.surface",
  borderBlockStartColor: "border.default",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "thin",
  display: "flex",
  flexShrink: "0",
  justifyContent: "space-around",
  md: {
    display: "none",
  },
  minBlockSize: "[3.875rem]",
  paddingBlockEnd: "2",
});

export const tabItem = cva({
  base: {
    alignItems: "center",
    color: "fg.faint",
    display: "flex",
    flexDirection: "column",
    fontSize: "[0.5625rem]",
    paddingInline: "2",
    rowGap: "[0.1875rem]",
    textDecoration: "none",
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
  _active: {
    scale: "0.94",
  },
  alignItems: "center",
  background: "accent.solid",
  blockSize: "[2.75rem]",
  borderRadius: "[0.9375rem]",
  boxShadow: "[0 6px 16px rgba(15,118,110,.4)]",
  color: "accent.fg",
  display: "flex",
  inlineSize: "[2.75rem]",
  justifyContent: "center",
  marginBlockStart: "[-1.375rem]",
  scale: "1",
  textDecoration: "none",
  transitionDuration: "hover",
  transitionProperty: "scale",
  transitionTimingFunction: "press",
});
