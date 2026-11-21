import { css } from "styled-system/css";

/** タグ管理画面全体。shell main の中で縦スクロールを持つ。 */
export const tagsPage = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  minBlockSize: "0",
  overscrollBehavior: "contain",
  overflowY: "auto",
  paddingBlock: { base: "4", md: "6" },
  paddingInline: { base: "3.5", md: "6" },
});

/** 読みやすい幅で中央に配置する。 */
export const tagsPageInner = css({
  display: "flex",
  flexDirection: "column",
  inlineSize: "100%",
  marginInline: "auto",
  maxInlineSize: "[44rem]",
  minBlockSize: "0",
});

export const tagsHeadRow = css({
  alignItems: "center",
  columnGap: "2.5",
  display: "flex",
});

export const tagsTitle = css({
  color: "fg.default",
  fontSize: { base: "md", md: "lg" },
  fontWeight: "bold",
  letterSpacing: "tight",
  margin: "0",
});

export const tagsCount = css({
  alignItems: "center",
  background: "surface.muted",
  borderRadius: "full",
  color: "fg.muted",
  display: "inline-flex",
  fontFamily: "mono",
  fontSize: "2xs",
  fontWeight: "medium",
  paddingBlock: "0.5",
  paddingInline: "2",
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
  color: "fg.muted",
  columnGap: "1.5",
  display: "inline-flex",
  fontSize: "2xs",
  marginInlineStart: "auto",
});

/** `タグを検索…` の枠付きボックス。input は枠なしで内側に置く。 */
export const tagSearchBox = css({
  "@media (hover: hover) and (pointer: fine)": {
    "&:hover:not(:focus-within)": {
      borderColor: "fg.faint",
    },
  },
  _focusWithin: {
    borderColor: "accent.solid",
    boxShadow: "accentRing",
  },
  alignItems: "center",
  background: "bg.surface",
  borderColor: "border.control",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  columnGap: "2",
  display: "flex",
  marginBlockStart: "3",
  minBlockSize: "touch",
  paddingBlock: "1.5",
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
  fontSize: "[max(1rem, 0.875rem)]",
  md: {
    fontSize: "sm",
  },
  minInlineSize: "0",
  outline: "none",
  padding: "0",
});

export const tagRowList = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "sheet",
  borderStyle: "solid",
  borderWidth: "thin",
  boxShadow: "surface",
  display: "flex",
  flexDirection: "column",
  listStyle: "none",
  margin: "0",
  marginBlockStart: "4",
  overflow: "hidden",
  padding: "0",
  "& > li + li": {
    borderBlockStartColor: "border.default",
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "thin",
  },
});

export const tagRow = css({
  "@media (hover: hover) and (pointer: fine)": {
    "&:hover": {
      background: "surface.muted",
    },
  },
  alignItems: "center",
  columnGap: "2.5",
  display: "flex",
  fontSize: "sm",
  minBlockSize: "[3.25rem]",
  paddingBlock: "2",
  paddingInline: { base: "3.5", md: "4" },
  transitionDuration: "hover",
  transitionProperty: "background-color",
});

/** 行タップでそのタグの一覧へ。dot・名前・件数まで Link が担う。 */
export const tagRowLink = css({
  alignItems: "center",
  color: "fg.default",
  columnGap: "2.5",
  display: "flex",
  flex: "1",
  minBlockSize: "[2.5rem]",
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
  color: "fg.muted",
  flexShrink: "0",
  fontFamily: "mono",
  fontSize: "2xs",
  marginInlineStart: "auto",
  whiteSpace: "nowrap",
});

/** 行末アクション（rename / delete）。モバイル・デスクトップ共通で操作できる。 */
export const tagRowOps = css({
  columnGap: "1",
  display: "flex",
  flexShrink: "0",
});

export const tagRowSkeleton = css({
  alignItems: "center",
  columnGap: "2.5",
  display: "flex",
  minBlockSize: "[3.25rem]",
  paddingBlock: "3",
  paddingInline: { base: "3.5", md: "4" },
});

/** ダイアログ内の `タグ名` ラベル。フィールドの余白は dialogField が持つ。 */
export const tagDialogLabel = css({
  color: "fg.default",
  fontSize: "xs",
  fontWeight: "semibold",
});
