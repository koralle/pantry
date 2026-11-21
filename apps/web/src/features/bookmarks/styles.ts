import { css, cva } from "styled-system/css";

export const listInner = css({
  inlineSize: "100%",
  marginInline: "auto",
  maxInlineSize: "[68rem]",
  paddingInline: { base: "3", md: "6" },
});

export const listHead = css({
  alignItems: "center",
  columnGap: "3",
  display: "flex",
  inlineSize: "100%",
  marginInline: "auto",
  maxInlineSize: "[68rem]",
  paddingBlockEnd: { base: "2.5", md: "3" },
  paddingBlockStart: { base: "3.5", md: "5" },
  paddingInline: { base: "3", md: "6" },
});

export const listTitle = css({
  color: "fg.default",
  fontSize: { base: "md", md: "lg" },
  fontWeight: "bold",
  letterSpacing: "-0.015em",
  lineHeight: "tight",
  margin: "0",
});

export const listSub = css({
  alignItems: "center",
  background: "surface.muted",
  borderRadius: "full",
  color: "fg.muted",
  display: "inline-flex",
  flexShrink: "0",
  fontFamily: "mono",
  fontSize: "2xs",
  fontWeight: "medium",
  paddingBlock: "0.5",
  paddingInline: "2",
});

export const listTools = css({
  columnGap: "2",
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
  overscrollBehavior: "contain",
  overflowY: "auto",
  paddingBlockEnd: "4",
});

export const stateFill = css({
  marginBlock: "auto",
});

export const segControl = css({
  background: "bg.surface",
  borderColor: "border.control",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  display: { base: "none", md: "flex" },
  overflow: "hidden",
  padding: "0.5",
  gap: "0.5",
});

export const segItem = cva({
  base: {
    alignItems: "center",
    borderRadius: "[0.3125rem]",
    color: "fg.muted",
    columnGap: "1.5",
    display: "inline-flex",
    fontSize: "2xs",
    fontWeight: "medium",
    minBlockSize: "[1.875rem]",
    paddingBlock: "1",
    paddingInline: "2.5",
    textDecoration: "none",
    transitionDuration: "hover",
    transitionProperty: "background-color, color",
    "@media (hover: hover) and (pointer: fine)": {
      _hover: {
        background: "surface.muted",
        color: "fg.default",
      },
    },
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
        "@media (hover: hover) and (pointer: fine)": {
          _hover: {
            background: "fg.default",
            color: "bg.canvas",
          },
        },
      },
    },
  },
});

export const hintBar = css({
  background: "bg.surface",
  borderBlockStartColor: "border.default",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "thin",
  color: "fg.muted",
  display: { base: "none", md: "block" },
  flexShrink: "0",
  fontSize: "2xs",
  paddingBlock: "2",
});

export const hintBarInner = css({
  alignItems: "center",
  columnGap: "5",
  display: "flex",
  flexWrap: "wrap",
  inlineSize: "100%",
  marginInline: "auto",
  maxInlineSize: "[68rem]",
  paddingInline: "6",
  rowGap: "1.5",
});

export const hintItem = css({
  alignItems: "center",
  columnGap: "1.5",
  display: "inline-flex",
});

export const hintKeys = css({
  alignItems: "center",
  columnGap: "1",
  display: "inline-flex",
});

export const cardGrid = css({
  alignContent: "start",
  display: { base: "none", md: "grid" },
  gap: "3.5",
  gridTemplateColumns: "repeat(auto-fill, minmax(17.5rem, 1fr))",
  inlineSize: "100%",
  listStyle: "none",
  marginBlock: "0",
  marginInline: "auto",
  maxInlineSize: "[68rem]",
  paddingBlockEnd: "4",
  paddingBlockStart: "0.5",
  paddingInline: "6",
});

export const cardCell = css({
  display: "flex",
  minInlineSize: "0",
});

export const cardSurface = cva({
  base: {
    background: "bg.surface",
    borderColor: "border.default",
    borderRadius: "sheet",
    borderStyle: "solid",
    borderWidth: "thin",
    boxShadow: "card",
    color: "fg.default",
    display: "flex",
    flex: "1",
    flexDirection: "column",
    overflow: "hidden",
    padding: "4",
    position: "relative",
    transitionDuration: "hover",
    transitionProperty: "border-color, box-shadow, background-color",
    transitionTimingFunction: "out",
    "&:has([data-primary-link]:focus-visible)": {
      outline: "2px solid token(colors.accent.solid)",
      outlineOffset: "2px",
    },
    "@media (hover: hover) and (pointer: fine)": {
      _hover: {
        borderColor: "border.control",
        boxShadow: "cardHover",
      },
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
        borderColor: "border.accent",
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
  color: "fg.muted",
  fontFamily: "mono",
  fontSize: "2xs",
  minInlineSize: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const cardTopRight = css({
  alignItems: "center",
  columnGap: "1.5",
  display: "flex",
  flexShrink: "0",
  marginInlineStart: "auto",
});

export const cardStar = css({
  color: "star.solid",
  display: "inline-flex",
  flexShrink: "0",
});

export const cardTitleWrap = css({
  marginBlockStart: "2.5",
});

export const cardPrimaryLink = css({
  color: "fg.default",
  display: "-webkit-box",
  fontSize: "sm",
  fontWeight: "semibold",
  lineClamp: 2,
  lineHeight: "1.45",
  minBlockSize: "[2.9em]",
  textDecoration: "none",
  _after: {
    content: '""',
    inset: "0",
    position: "absolute",
  },
  _focusVisible: {
    outline: "none",
  },
});

export const cardFoot = css({
  alignItems: "center",
  borderBlockStartColor: "border.default",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "thin",
  columnGap: "1.5",
  display: "flex",
  flexWrap: "wrap",
  marginBlockStart: "auto",
  paddingBlockStart: "3",
  paddingTop: "3",
  rowGap: "1.5",
});

export const cardDate = css({
  color: "fg.muted",
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

export const rowsWrap = css({
  inlineSize: "100%",
  marginInline: "auto",
  maxInlineSize: "[68rem]",
  paddingInline: { base: "3", md: "6" },
});

export const rowsSurface = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "sheet",
  borderStyle: "solid",
  borderWidth: "thin",
  boxShadow: "surface",
  listStyle: "none",
  margin: "0",
  overflow: "hidden",
  padding: "0",
  "& > li + li": {
    borderBlockStartColor: "border.default",
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "thin",
  },
});

export const rows = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "sheet",
  borderStyle: "solid",
  borderWidth: "thin",
  boxShadow: "surface",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  "& > div + div": {
    borderBlockStartColor: "border.default",
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "thin",
  },
});

export const rowArticle = cva({
  base: {
    alignItems: { base: "flex-start", md: "center" },
    color: "fg.default",
    columnGap: "3",
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr) auto",
    paddingBlock: { base: "3", md: "2.5" },
    paddingInline: { base: "3.5", md: "4" },
    position: "relative",
    transitionDuration: "hover",
    transitionProperty: "background-color",
    transitionTimingFunction: "out",
    "&:has([data-primary-link]:focus-visible)": {
      outline: "2px solid token(colors.accent.solid)",
      outlineOffset: "-2px",
    },
    "@media (hover: hover) and (pointer: fine)": {
      _hover: {
        background: "surface.muted",
      },
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
        boxShadow: "inset 3px 0 0 token(colors.accent.solid)",
        "@media (hover: hover) and (pointer: fine)": {
          _hover: {
            background: "accent.subtle",
          },
        },
      },
    },
  },
});

export const rowTile = css({
  paddingBlockStart: { base: "0.5", md: "0" },
});

export const rowContent = css({
  alignItems: { base: "stretch", md: "center" },
  columnGap: "3",
  display: "flex",
  flexDirection: { base: "column", md: "row" },
  minInlineSize: "0",
  rowGap: "1.5",
});

export const rowTitleWrap = css({
  minInlineSize: "0",
  md: {
    flex: "1",
  },
});

export const rowPrimaryLink = css({
  color: "fg.default",
  display: "-webkit-box",
  fontSize: "sm",
  fontWeight: "semibold",
  lineClamp: 2,
  lineHeight: "1.4",
  textDecoration: "none",
  md: {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  _after: {
    content: '""',
    inset: "0",
    position: "absolute",
  },
  _focusVisible: {
    outline: "none",
  },
});

export const rowTags = css({
  alignItems: "center",
  columnGap: "1.5",
  display: "flex",
  flexWrap: "wrap",
  md: {
    flexShrink: "0",
    order: "2",
  },
  rowGap: "1",
});

export const rowTagOverflow = css({
  background: "surface.muted",
  borderRadius: "full",
  color: "fg.muted",
  fontFamily: "mono",
  fontSize: "2xs",
  lineHeight: "1.4",
  paddingBlock: "0.5",
  paddingInline: "2",
});

export const rowMetaLine = css({
  alignItems: "center",
  color: "fg.muted",
  columnGap: "1.5",
  display: "flex",
  fontFamily: "mono",
  fontSize: "2xs",
  minInlineSize: "0",
  md: {
    flexShrink: "0",
    justifyContent: "flex-end",
    order: "3",
  },
});

export const rowDomain = css({
  minInlineSize: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  md: {
    maxInlineSize: "[12rem]",
  },
});

export const rowMetaSep = css({
  color: "fg.faint",
  flexShrink: "0",
});

export const rowDate = css({
  flexShrink: "0",
  whiteSpace: "nowrap",
});

export const rowStar = css({
  color: "star.solid",
  display: "inline-flex",
  flexShrink: "0",
});

export const externalActionLink = css({
  alignItems: "center",
  borderRadius: "box",
  color: "fg.faint",
  display: "inline-flex",
  flexShrink: "0",
  justifyContent: "center",
  minBlockSize: "touch",
  minInlineSize: "touch",
  position: "relative",
  textDecoration: "none",
  transitionDuration: "hover",
  transitionProperty: "background-color, color",
  zIndex: "1",
  "@media (pointer: fine)": {
    minBlockSize: "[2rem]",
    minInlineSize: "[2rem]",
  },
  "@media (hover: hover) and (pointer: fine)": {
    _hover: {
      background: "surface.muted",
      color: "fg.default",
    },
  },
  _focusVisible: {
    outline: "2px solid token(colors.accent.solid)",
    outlineOffset: "2px",
  },
});

export const quickAddStrip = css({
  alignItems: "center",
  background: "bg.surface",
  borderColor: "border.control",
  borderRadius: "sheet",
  borderStyle: "dashed",
  borderWidth: "thin",
  color: "fg.muted",
  columnGap: "2.5",
  display: { base: "none", md: "flex" },
  fontSize: "xs",
  marginBlockEnd: "3",
  paddingBlock: "2.5",
  paddingInline: "3.5",
  textDecoration: "none",
  transitionDuration: "hover",
  transitionProperty: "background-color, border-color, color",
  "@media (hover: hover) and (pointer: fine)": {
    _hover: {
      background: "accent.hover",
      borderColor: "border.accent",
      color: "fg.default",
    },
  },
});

export const quickAddBadge = css({
  alignItems: "center",
  background: "accent.solid",
  borderRadius: "box",
  blockSize: "[1.375rem]",
  color: "accent.fg",
  display: "flex",
  flexShrink: "0",
  inlineSize: "[1.375rem]",
  justifyContent: "center",
});

export const inboxCallout = css({
  alignItems: "center",
  background:
    "linear-gradient(115deg, token(colors.inbox.bgStart), token(colors.inbox.bgEnd))",
  borderColor: "inbox.border",
  borderRadius: "sheet",
  borderStyle: "solid",
  borderWidth: "thin",
  color: "fg.default",
  columnGap: "3",
  display: "flex",
  marginBlockEnd: "3",
  paddingBlock: { base: "2.5", md: "3" },
  paddingInline: { base: "3.5", md: "4" },
  textDecoration: "none",
  transitionDuration: "hover",
  transitionProperty: "border-color, box-shadow",
  "@media (hover: hover) and (pointer: fine)": {
    _hover: {
      boxShadow: "surface",
    },
  },
});

export const inboxBadge = css({
  alignItems: "center",
  background: "bg.surface",
  borderRadius: "[0.5rem]",
  blockSize: { base: "[1.75rem]", md: "[2.125rem]" },
  boxShadow: "surface",
  color: "inbox.fg",
  display: "flex",
  flexShrink: "0",
  inlineSize: { base: "[1.75rem]", md: "[2.125rem]" },
  justifyContent: "center",
});

export const inboxTitle = css({
  fontSize: { base: "xs", md: "sm" },
  fontWeight: "bold",
});

export const inboxSub = css({
  color: "inbox.sub",
  fontSize: "2xs",
});

export const inboxAction = css({
  alignItems: "center",
  background: "fg.default",
  borderRadius: "full",
  color: "bg.canvas",
  columnGap: "1.5",
  display: { base: "none", md: "flex" },
  flexShrink: "0",
  fontSize: "2xs",
  fontWeight: "bold",
  marginInlineStart: "auto",
  paddingBlock: "1.5",
  paddingInline: "3.5",
  whiteSpace: "nowrap",
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
  borderColor: "danger.border",
  borderRadius: "sheet",
  borderStyle: "solid",
  borderWidth: "thin",
  color: "danger.solid",
  columnGap: "2.5",
  display: "flex",
  fontSize: "xs",
  marginBlockEnd: "3",
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
  paddingBlock: "2.5",
  paddingInline: { base: "3.5", md: "4" },
  md: {
    minBlockSize: "[3rem]",
  },
});

export const skeletonBody = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  minInlineSize: "0",
  rowGap: "1.5",
});
