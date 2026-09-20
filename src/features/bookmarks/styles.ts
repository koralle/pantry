import { css, cva } from "styled-system/css";

export const listHead = css({
  alignItems: "center",
  columnGap: "3",
  display: "flex",
  paddingBlockEnd: "1.5",
  paddingBlockStart: "2.5",
  paddingInline: "[1.125rem]",
  md: {
    paddingBlockEnd: "2.5",
    paddingBlockStart: "4.5",
    paddingInline: "4",
  },
});

export const listTitle = css({
  color: "fg.faint",
  fontSize: "2xs",
  fontWeight: "bold",
  letterSpacing: "[0.08em]",
  textTransform: "uppercase",
  md: {
    color: "fg.default",
    fontSize: "lg",
    letterSpacing: "-0.01em",
    textTransform: "none",
  },
});

export const listSub = css({
  display: "none",
  md: {
    color: "fg.faint",
    display: "inline",
    fontFamily: "mono",
    fontSize: "2xs",
  },
});

export const listTools = css({
  columnGap: "1.5",
  display: "flex",
  marginInlineStart: "auto",
});

/** 一覧画面の縦積みコンテナ。main・section・motion ラッパーに共通で適用する。 */
export const listColumn = css({
  display: "flex",
  flexDirection: "column",
  flex: "1",
  minBlockSize: "0",
});

/** 行/カードのスクロール領域。ヒントバーを下端に固定するための内側スクローラー。 */
export const listScroll = css({
  display: "flex",
  flexDirection: "column",
  flex: "1",
  minBlockSize: "0",
  overflowY: "auto",
});

export const stateFill = css({
  marginBlock: "auto",
});

export const segControl = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "[0.4375rem]",
  borderStyle: "solid",
  borderWidth: "thin",
  display: { base: "none", md: "flex" },
  overflow: "hidden",
});

export const segItem = cva({
  base: {
    alignItems: "center",
    color: "fg.faint",
    columnGap: "[0.3125rem]",
    display: "flex",
    fontSize: "[0.6875rem]",
    paddingBlock: "1",
    paddingInline: "2.5",
    textDecoration: "none",
  },
  defaultVariants: {
    on: false,
  },
  variants: {
    on: {
      false: {},
      true: {
        background: "fg.default",
        color: "bg.canvas",
      },
    },
  },
});

export const hintBar = css({
  alignItems: "center",
  background: "bg.surface",
  borderBlockStartColor: "border.default",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "thin",
  blockSize: "[2.125rem]",
  color: "fg.faint",
  columnGap: "[1.125rem]",
  display: { base: "none", md: "flex" },
  flexShrink: "0",
  fontSize: "[0.6875rem]",
  paddingInline: "5",
  "& b": {
    color: "fg.muted",
    fontWeight: "semibold",
  },
});

export const cardGrid = css({
  alignContent: "start",
  display: { base: "none", md: "grid" },
  gap: "3.5",
  gridTemplateColumns: "repeat(3, 1fr)",
  paddingBlockEnd: "3",
  paddingBlockStart: "0.5",
  paddingInline: "4",
});

export const cardLink = cva({
  base: {
    background: "bg.surface",
    borderRadius: "[0.875rem]",
    boxShadow: "[0 1px 3px rgba(0,0,0,.07)]",
    color: "fg.default",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    padding: "3.5",
    textDecoration: "none",
    transitionDuration: "hover",
    transitionProperty: "box-shadow",
    _hover: {
      boxShadow: "[0 4px 12px rgba(0,0,0,.10)]",
    },
  },
  defaultVariants: {
    selected: false,
  },
  variants: {
    selected: {
      false: {},
      true: {
        background: "accent.subtle",
      },
    },
  },
});

export const cardTop = css({
  alignItems: "center",
  columnGap: "2.5",
  display: "flex",
});

export const cardDomain = css({
  color: "fg.faint",
  fontFamily: "mono",
  fontSize: "2xs",
  minInlineSize: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const cardStar = css({
  color: "star.solid",
  display: "flex",
  flexShrink: "0",
  marginInlineStart: "auto",
});

export const cardTitle = css({
  fontSize: "[0.8125rem]",
  fontWeight: "bold",
  lineClamp: 2,
  lineHeight: "1.45",
  marginBlockStart: "2",
  minBlockSize: "[2.9em]",
});

export const cardFoot = css({
  alignItems: "center",
  borderBlockStartColor: "border.default",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "thin",
  columnGap: "1.5",
  display: "flex",
  marginBlockStart: "2.5",
  paddingBlockStart: "2.5",
});

export const cardDate = css({
  color: "fg.faint",
  flexShrink: "0",
  fontFamily: "mono",
  fontSize: "2xs",
  marginInlineStart: "auto",
});

export const rowsMobileOnly = css({
  md: {
    display: "none",
  },
});

export const rows = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  minBlockSize: "0",
  overflowY: "auto",
  paddingInline: "1.5",
});

export const rowLink = cva({
  base: {
    alignItems: "center",
    color: "fg.default",
    display: "flex",
    textDecoration: "none",
  },
  variants: {
    layout: {
      desktop: {
        borderRadius: "[0.5625rem]",
        blockSize: "[2.875rem]",
        columnGap: "3",
        display: { base: "none", md: "flex" },
        fontSize: "sm",
        paddingInline: "3",
      },
      mobile: {
        alignItems: "flex-start",
        borderRadius: "0.75rem",
        columnGap: "[0.6875rem]",
        display: { base: "flex", md: "none" },
        minBlockSize: "3.5rem",
        paddingBlock: "[0.5625rem]",
        paddingInline: "2.5",
      },
    },
    selected: {
      true: {
        background: "accent.subtle",
      },
    },
  },
  defaultVariants: {
    layout: "desktop",
  },
});

export const rowHover = css({
  _hover: {
    background: "surface.muted",
  },
});

export const rowTitle = css({
  fontWeight: "semibold",
  minInlineSize: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const rowDomain = css({
  color: "fg.faint",
  flexShrink: "0",
  fontFamily: "mono",
  fontSize: "2xs",
  whiteSpace: "nowrap",
});

export const rowTags = css({
  alignItems: "center",
  columnGap: "1.5",
  display: "flex",
  flexShrink: "0",
  marginInlineStart: "auto",
});

export const rowDate = css({
  color: "fg.faint",
  flexShrink: "0",
  fontFamily: "mono",
  fontSize: "2xs",
  inlineSize: "[3.25rem]",
  textAlign: "end",
});

export const rowStar = css({
  color: "star.solid",
  flexShrink: "0",
  display: "flex",
});

export const rowStarInline = css({
  color: "star.solid",
  display: "inline-flex",
  marginInlineStart: "1",
  verticalAlign: "-1px",
});

export const rowMain = css({
  display: "flex",
  flexDirection: "column",
  minInlineSize: "0",
  rowGap: "[0.25rem]",
});

export const rowTitleMobile = css({
  fontSize: "sm",
  fontWeight: "semibold",
  lineClamp: 2,
  lineHeight: "1.35",
});

export const rowMeta = css({
  alignItems: "center",
  color: "fg.faint",
  columnGap: "1.5",
  display: "flex",
  fontFamily: "mono",
  fontSize: "2xs",
  minInlineSize: "0",
});

export const rowMetaDots = css({
  alignItems: "center",
  columnGap: "[0.3125rem]",
  display: "flex",
  flexShrink: "0",
});

export const rowMetaDot = css({
  borderRadius: "full",
  blockSize: "[0.4375rem]",
  inlineSize: "[0.4375rem]",
});

export const quickAddStrip = css({
  alignItems: "center",
  background: "bg.surface",
  border: "1px dashed token(colors.border.default)",
  borderRadius: "[0.5625rem]",
  color: "fg.faint",
  columnGap: "2.5",
  display: { base: "none", md: "flex" },
  fontSize: "xs",
  marginBlockEnd: "2.5",
  marginInline: "4",
  paddingBlock: "2",
  paddingInline: "3.5",
  textDecoration: "none",
});

export const quickAddBadge = css({
  alignItems: "center",
  background: "accent.solid",
  borderRadius: "[0.375rem]",
  blockSize: "[1.125rem]",
  color: "accent.fg",
  display: "flex",
  flexShrink: "0",
  inlineSize: "[1.125rem]",
  justifyContent: "center",
});

export const inboxCallout = css({
  alignItems: "center",
  background:
    "linear-gradient(115deg, token(colors.pantry.inboxStart), token(colors.pantry.inboxEnd))",
  borderRadius: "0.75rem",
  color: "fg.default",
  columnGap: "3",
  display: "flex",
  marginBlockEnd: "3",
  marginInline: "1.5",
  paddingBlock: "2.5",
  paddingInline: "3.5",
  textDecoration: "none",
  md: {
    marginInline: "4",
    paddingBlock: "[0.6875rem]",
    paddingInline: "4",
  },
});

export const inboxBadge = css({
  alignItems: "center",
  background: "bg.surface",
  borderRadius: "[0.5rem]",
  blockSize: "[1.625rem]",
  boxShadow: "[0 1px 3px rgba(0,0,0,0.08)]",
  color: "pantry.inboxFg",
  display: "flex",
  flexShrink: "0",
  inlineSize: "[1.625rem]",
  justifyContent: "center",
  md: {
    borderRadius: "[0.625rem]",
    blockSize: "[2.125rem]",
    inlineSize: "[2.125rem]",
  },
});

export const inboxTitle = css({
  fontSize: "xs",
  fontWeight: "bold",
  md: {
    fontSize: "sm",
  },
});

export const inboxSub = css({
  color: "pantry.inboxSub",
  fontSize: "2xs",
});

export const inboxAction = css({
  alignItems: "center",
  background: "fg.default",
  borderRadius: "full",
  color: "bg.canvas",
  columnGap: "1.5",
  display: "none",
  flexShrink: "0",
  fontSize: "2xs",
  fontWeight: "bold",
  marginInlineStart: "auto",
  paddingBlock: "[0.4375rem]",
  paddingInline: "[0.8125rem]",
  textDecoration: "none",
  whiteSpace: "nowrap",
  md: {
    display: "flex",
  },
});

export const desktopOnlyText = css({
  display: "none",
  md: {
    display: "inline",
  },
});

export const mobileOnlyText = css({
  md: {
    display: "none",
  },
});

export const listBanner = css({
  alignItems: "center",
  background: "danger.surface",
  borderRadius: "[0.5625rem]",
  color: "danger.solid",
  columnGap: "2.5",
  display: "flex",
  fontSize: "xs",
  marginBlockEnd: "2.5",
  marginInline: "4",
  paddingBlock: "2",
  paddingInline: "3.5",
});

export const listBannerAction = css({
  alignItems: "center",
  appearance: "none",
  background: "none",
  border: "none",
  color: "danger.solid",
  columnGap: "1",
  cursor: "pointer",
  display: "flex",
  flexShrink: "0",
  font: "inherit",
  fontWeight: "bold",
  marginInlineStart: "auto",
  padding: "0",
  whiteSpace: "nowrap",
});

export const skeletonRow = css({
  alignItems: "center",
  columnGap: "3",
  display: "flex",
  minBlockSize: "[3.5rem]",
  paddingBlock: "[0.5625rem]",
  paddingInline: "2.5",
  md: {
    blockSize: "[2.875rem]",
    minBlockSize: "0",
    paddingBlock: "0",
    paddingInline: "3",
  },
});

export const skeletonBody = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  minInlineSize: "0",
  rowGap: "[0.4375rem]",
});
