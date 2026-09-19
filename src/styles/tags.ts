import { css } from "styled-system/css";

/** タグ管理画面全体。shell main の中で縦スクロールを持つ。 */
export const tagsPage = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  minBlockSize: "0",
  overflowY: "auto",
  paddingBlock: "4",
  paddingInline: "4",
  md: {
    paddingBlock: "6",
    paddingInline: "6",
  },
});

/** モックの `.page-inner` — 行が読みやすい幅に抑える。 */
export const tagsPageInner = css({
  display: "flex",
  flexDirection: "column",
  maxInlineSize: "[35rem]",
  minBlockSize: "0",
  inlineSize: "100%",
});

export const tagsHeadRow = css({
  alignItems: "center",
  columnGap: "2.5",
  display: "flex",
});

export const tagsTitle = css({
  fontSize: "[1.0625rem]",
  fontWeight: "bold",
  letterSpacing: "tight",
  margin: "0",
});

export const tagsCount = css({
  color: "fg.faint",
  fontFamily: "mono",
  fontSize: "2xs",
});

/** `新規タグ`（desktop）と `+`（mobile）は display で切り替える。 */
export const tagsHeadCreate = css({
  display: { base: "none", md: "inline-flex" },
  marginInlineStart: "auto",
});

export const tagsHeadCreateMobile = css({
  display: { base: "inline-flex", md: "none" },
  marginInlineStart: "auto",
});

/** Loading 中の `読み込み中…` — head row の右端に寄せる。 */
export const tagsLoadingNote = css({
  alignItems: "center",
  color: "fg.faint",
  columnGap: "1.5",
  display: "inline-flex",
  fontSize: "2xs",
  marginInlineStart: "auto",
});

/** `タグを検索…` の枠付きボックス。input は枠なしで内側に置く。 */
export const tagSearchBox = css({
  _focusWithin: {
    borderColor: "accent.solid",
    boxShadow: "[0_0_0_3px_{colors.accent.subtle}]",
  },
  alignItems: "center",
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "[0.5625rem]",
  borderStyle: "solid",
  borderWidth: "thin",
  columnGap: "2",
  display: "flex",
  marginBlockStart: "2.5",
  paddingBlock: "2",
  paddingInline: "3",
  transitionDuration: "hover",
  transitionProperty: "border-color, box-shadow",
});

export const tagSearchIcon = css({
  color: "fg.faint",
  display: "inline-flex",
  flexShrink: "0",
});

export const tagSearchInput = css({
  _placeholder: {
    color: "fg.faint",
  },
  background: "transparent",
  borderWidth: "none",
  color: "fg.default",
  flex: "1",
  fontFamily: "inherit",
  fontSize: "sm",
  minInlineSize: "0",
  outline: "none",
  padding: "0",
});

export const tagRowList = css({
  display: "flex",
  flexDirection: "column",
  marginBlockStart: "4",
});

export const tagRow = css({
  "@media (any-hover: hover)": {
    "&:hover": {
      background: "surface.muted",
    },
  },
  alignItems: "center",
  borderBlockEndColor: "border.default",
  borderBlockEndStyle: "solid",
  borderBlockEndWidth: "thin",
  borderRadius: "box",
  columnGap: "2.5",
  display: "flex",
  fontSize: "sm",
  paddingBlock: "3",
  paddingInline: "2.5",
  transitionDuration: "hover",
  transitionProperty: "background-color",
  md: {
    paddingBlock: "[0.5625rem]",
    paddingInline: "1",
  },
});

/** 行タップでそのタグの一覧へ。dot・名前・件数・chevron まで Link が担う。 */
export const tagRowLink = css({
  alignItems: "center",
  color: "fg.default",
  columnGap: "2.5",
  display: "flex",
  flex: "1",
  minInlineSize: "0",
  textDecoration: "none",
});

export const tagRowName = css({
  fontWeight: "semibold",
  minInlineSize: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const tagRowCount = css({
  color: "fg.faint",
  flexShrink: "0",
  fontFamily: "mono",
  fontSize: "2xs",
  marginInlineStart: "auto",
  whiteSpace: "nowrap",
});

/** mobile の行末 chevron。Link の中の装飾で、別ボタンにはしない。 */
export const tagRowChevron = css({
  color: "fg.faint",
  display: { base: "inline-flex", md: "none" },
  flexShrink: "0",
});

/** desktop の行末アクション（rename / delete）。mobile では chevron に譲る。 */
export const tagRowOps = css({
  columnGap: "1",
  display: { base: "none", md: "flex" },
  flexShrink: "0",
  marginInlineStart: "auto",
});

export const tagRowSkeleton = css({
  alignItems: "center",
  borderBlockEndColor: "border.default",
  borderBlockEndStyle: "solid",
  borderBlockEndWidth: "thin",
  columnGap: "2.5",
  display: "flex",
  paddingBlock: "3.5",
  paddingInline: "2.5",
  md: {
    paddingBlock: "3",
    paddingInline: "1",
  },
});

/** ダイアログ内の `タグ名` ラベル + 入力のまとまり。 */
export const tagDialogField = css({
  display: "flex",
  flexDirection: "column",
  marginBlockStart: "1",
  rowGap: "1.5",
});

export const tagDialogLabel = css({
  color: "fg.muted",
  fontSize: "2xs",
  fontWeight: "bold",
  letterSpacing: "[0.02em]",
});
