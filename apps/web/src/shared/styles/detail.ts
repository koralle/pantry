import { css, cva } from "styled-system/css";

/** 詳細画面全体。shell main の中で縦スクロールを持つ。 */
export const detailPage = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  minBlockSize: "0",
  overscrollBehavior: "contain",
  overflowY: "auto",
  paddingBlockEnd: "6",
});

/** 中央寄せの状態表示（Loading / Error / 未検出）用の余白いっぱいのコンテナ。 */
export const detailCenter = css({
  alignItems: "center",
  display: "flex",
  flex: "1",
  justifyContent: "center",
  padding: "6",
});

export const detailFlashRow = css({
  inlineSize: "100%",
  marginInline: "auto",
  maxInlineSize: "[42rem]",
  paddingBlockStart: "3",
  paddingInline: { base: "4", md: "6" },
});

export const detailBacklinkRow = css({
  inlineSize: "100%",
  marginInline: "auto",
  maxInlineSize: "[42rem]",
  paddingBlockStart: { base: "3", md: "5" },
  paddingInline: { base: "4", md: "6" },
});

export const backlink = css({
  "@media (hover: hover) and (pointer: fine)": {
    "&:hover": {
      background: "surface.muted",
      color: "fg.default",
    },
  },
  "@media (pointer: coarse)": {
    minBlockSize: "touch",
  },
  alignItems: "center",
  borderRadius: "box",
  color: "fg.muted",
  columnGap: "1.5",
  display: "inline-flex",
  fontSize: "xs",
  fontWeight: "medium",
  paddingBlock: "1",
  paddingInline: "2",
  marginInlineStart: "-2",
  textDecoration: "none",
  transitionDuration: "hover",
  transitionProperty: "background-color, color",
});

export const detailWrap = css({
  inlineSize: "100%",
  marginInline: "auto",
  maxInlineSize: "[42rem]",
  paddingBlock: { base: "3.5", md: "5" },
  paddingInline: { base: "4", md: "6" },
});

export const detailCard = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "sheet",
  borderStyle: "solid",
  borderWidth: "thin",
  boxShadow: "card",
  inlineSize: "100%",
  padding: { base: "5", md: "7" },
});

export const detailTop = css({
  alignItems: "center",
  columnGap: "3",
  display: "flex",
});

export const detailDomain = css({
  color: "fg.muted",
  fontFamily: "mono",
  fontSize: "xs",
  minInlineSize: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const detailTitle = css({
  color: "fg.default",
  fontSize: { base: "md", md: "lg" },
  fontWeight: "bold",
  letterSpacing: "tight",
  lineHeight: "1.35",
  marginBlockStart: "4",
  textWrap: "balance",
});

export const detailUrlRow = css({
  alignItems: "flex-start",
  background: "surface.muted",
  borderColor: "border.default",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  columnGap: "2",
  display: "flex",
  justifyContent: "space-between",
  marginBlockStart: "3.5",
  paddingBlock: "2",
  paddingInline: "3",
});

export const detailUrl = css({
  "@media (hover: hover) and (pointer: fine)": {
    "&:hover": {
      textDecoration: "underline",
    },
  },
  alignItems: "flex-start",
  color: "accent.solid",
  columnGap: "1.5",
  display: "inline-flex",
  flex: "1",
  fontFamily: "mono",
  fontSize: "xs",
  lineHeight: "body",
  minInlineSize: "0",
  paddingBlock: "1",
  textDecoration: "none",
  wordBreak: "break-all",
});

export const detailUrlIcon = css({
  flexShrink: "0",
  marginBlockStart: "0.5",
});

export const detailTags = css({
  columnGap: "1.5",
  display: "flex",
  flexWrap: "wrap",
  marginBlockStart: "4",
  rowGap: "1.5",
  "& a": {
    display: "inline-flex",
    textDecoration: "none",
  },
});

export const detailNoteSection = css({
  marginBlockStart: "5",
});

export const detailNoteHeading = css({
  color: "fg.muted",
  fontSize: "2xs",
  fontWeight: "semibold",
  letterSpacing: "wide",
  margin: "0",
  marginBlockEnd: "1.5",
});

export const detailNote = css({
  background: "surface.muted",
  borderColor: "border.default",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  color: "fg.default",
  fontSize: "sm",
  lineHeight: "relaxed",
  margin: "0",
  paddingBlock: "3",
  paddingInline: "3.5",
  whiteSpace: "pre-wrap",
});

export const detailDates = css({
  borderBlockStartColor: "border.default",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "thin",
  color: "fg.muted",
  columnGap: "4",
  display: "flex",
  flexWrap: "wrap",
  fontFamily: "mono",
  fontSize: "2xs",
  marginBlockStart: "5",
  paddingBlockStart: "3.5",
  rowGap: "1",
});

export const detailActs = css({
  columnGap: "2.5",
  display: "flex",
  flexDirection: "column",
  marginBlockStart: "5",
  rowGap: "2.5",
  md: {
    flexDirection: "row",
  },
  "& > *": {
    inlineSize: "100%",
    md: {
      inlineSize: "auto",
    },
  },
});

export const detailActsSpacer = css({
  display: "none",
  md: {
    display: "block",
    flex: "1",
  },
});

/** お気に入りトグル。オフは輪郭スター、オンは塗りの amber。 */
export const starToggle = cva({
  base: {
    "@media (hover: hover) and (pointer: fine)": {
      "&:hover:not(:disabled)": {
        background: "surface.muted",
      },
    },
    "@media (pointer: coarse)": {
      minBlockSize: "touch",
      minInlineSize: "touch",
    },
    "@media (prefers-reduced-motion: no-preference)": {
      _active: {
        scale: "0.92",
      },
    },
    _disabled: {
      cursor: "wait",
      opacity: "0.6",
    },
    alignItems: "center",
    background: "transparent",
    borderRadius: "box",
    borderWidth: "none",
    color: "fg.muted",
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: "0",
    justifyContent: "center",
    marginInlineStart: "auto",
    scale: "1",
    transitionDuration: "hover",
    transitionProperty: "scale, background-color, color",
    transitionTimingFunction: "press",
    blockSize: "[2rem]",
    inlineSize: "[2rem]",
  },
  defaultVariants: {
    on: false,
  },
  variants: {
    on: {
      false: {},
      true: {
        color: "star.solid",
      },
    },
  },
});
