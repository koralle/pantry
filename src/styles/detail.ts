import { css, cva } from "styled-system/css";

/** 詳細画面全体。shell main の中で縦スクロールを持つ。 */
export const detailPage = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  minBlockSize: "0",
  overflowY: "auto",
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
  display: "flex",
  justifyContent: "center",
  paddingBlockStart: "3",
  paddingInline: "5",
  "& > *": {
    inlineSize: "100%",
    maxInlineSize: "[35rem]",
  },
});

export const detailBacklinkRow = css({
  paddingBlockStart: "3.5",
  paddingInline: "5",
});

export const backlink = css({
  "@media (any-hover: hover)": {
    "&:hover": {
      color: "fg.default",
    },
  },
  alignItems: "center",
  color: "fg.muted",
  columnGap: "1.5",
  display: "inline-flex",
  fontSize: "xs",
  fontWeight: "medium",
  textDecoration: "none",
  transitionDuration: "hover",
  transitionProperty: "color",
});

export const detailWrap = css({
  display: "flex",
  flex: "1",
  justifyContent: "center",
  paddingBlock: "6",
  paddingInline: "5",
});

export const detailCard = css({
  alignSelf: "flex-start",
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "[1rem]",
  borderStyle: "solid",
  borderWidth: "thin",
  inlineSize: "100%",
  maxInlineSize: "[35rem]",
  padding: "6",
});

export const detailTop = css({
  alignItems: "center",
  columnGap: "3",
  display: "flex",
});

export const detailDomain = css({
  color: "fg.faint",
  fontFamily: "mono",
  fontSize: "xs",
  minInlineSize: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const detailTitle = css({
  fontSize: "[1.125rem]",
  fontWeight: "bold",
  letterSpacing: "tight",
  lineHeight: "body",
  marginBlockStart: "3.5",
  md: {
    marginBlockStart: "4",
  },
});

export const detailUrl = css({
  "@media (any-hover: hover)": {
    "&:hover": {
      textDecoration: "underline",
    },
  },
  alignItems: "flex-start",
  color: "accent.solid",
  columnGap: "1.5",
  display: "flex",
  fontFamily: "mono",
  fontSize: "xs",
  lineHeight: "relaxed",
  marginBlockStart: "2",
  textDecoration: "none",
  wordBreak: "break-all",
});

export const detailTags = css({
  columnGap: "1.5",
  display: "flex",
  flexWrap: "wrap",
  marginBlockStart: "3.5",
  rowGap: "1.5",
});

export const detailNote = css({
  background: "surface.muted",
  borderRadius: "box",
  color: "fg.default",
  fontSize: "sm",
  lineHeight: "relaxed",
  marginBlockStart: "3.5",
  paddingBlock: "3",
  paddingInline: "3.5",
  whiteSpace: "pre-wrap",
});

export const detailDates = css({
  borderBlockStartColor: "border.default",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "thin",
  color: "fg.faint",
  columnGap: "4",
  display: "flex",
  fontFamily: "mono",
  fontSize: "2xs",
  marginBlockStart: "4",
  paddingBlockStart: "3.5",
});

export const detailActs = css({
  columnGap: "[0.5625rem]",
  display: "flex",
  flexDirection: "column",
  marginBlockStart: "4.5",
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
    "@media (any-hover: hover)": {
      "&:hover:not(:disabled)": {
        background: "surface.muted",
      },
    },
    _active: {
      scale: "0.92",
    },
    _disabled: {
      cursor: "wait",
      opacity: "0.6",
    },
    alignItems: "center",
    background: "transparent",
    borderRadius: "box",
    borderWidth: "none",
    color: "fg.faint",
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
