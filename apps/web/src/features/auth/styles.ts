import { css } from "styled-system/css";

/** アカウント画面全体。shell main の中で縦スクロールを持つ。 */
export const accountPage = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  minBlockSize: "0",
  overscrollBehavior: "contain",
  overflowY: "auto",
  paddingBlock: { base: "4", md: "6" },
  paddingInline: { base: "3.5", md: "6" },
});

export const accountPageInner = css({
  display: "flex",
  flexDirection: "column",
  gap: "4",
  inlineSize: "100%",
  marginInline: "auto",
  maxInlineSize: "[44rem]",
  minBlockSize: "0",
});

export const accountTitle = css({
  color: "fg.default",
  fontSize: { base: "md", md: "lg" },
  fontWeight: "bold",
  letterSpacing: "tight",
  margin: "0",
});

/** mobile 上部の `← 一覧へ戻る`。desktop はレールがあるので出さない。 */
export const accountBackRow = css({
  display: { base: "flex", md: "none" },
});

/** セクションカード。 */
export const accountSection = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "sheet",
  borderStyle: "solid",
  borderWidth: "thin",
  boxShadow: "surface",
  padding: { base: "4.5", md: "6" },
  "& > dl": {
    margin: "0",
  },
});

/** セクション見出し。 */
export const accountSectionHeading = css({
  color: "fg.muted",
  fontSize: "xs",
  fontWeight: "semibold",
  letterSpacing: "wide",
  margin: "0",
});

/** 見出しと中身の間隔。 */
export const accountSectionBody = css({
  marginBlockStart: "3",
});

/** `パスキー` 見出し + 右端の `追加` アクションの行。 */
export const accountSectionHeadRow = css({
  alignItems: "center",
  display: "flex",
  gap: "3",
});

export const accountSectionHeadAction = css({
  marginInlineStart: "auto",
});

/** 名前/メールの表示行。 */
export const accountKv = css({
  borderBlockEndColor: "border.default",
  borderBlockEndStyle: "solid",
  borderBlockEndWidth: "thin",
  columnGap: "3.5",
  display: "flex",
  flexWrap: "wrap",
  fontSize: "sm",
  margin: "0",
  paddingBlock: "2.5",
  "&:first-child": {
    paddingBlockStart: "0",
  },
  "&:last-child": {
    borderBlockEndWidth: "none",
    paddingBlockEnd: "0",
  },
});

export const accountKvKey = css({
  color: "fg.muted",
  flexShrink: "0",
  fontSize: "xs",
  fontWeight: "medium",
  inlineSize: "[4.5rem]",
});

export const accountKvValue = css({
  color: "fg.default",
  margin: "0",
  overflowWrap: "anywhere",
});

/** パスキー行。 */
export const passkeyRow = css({
  alignItems: "center",
  borderBlockEndColor: "border.default",
  borderBlockEndStyle: "solid",
  borderBlockEndWidth: "thin",
  columnGap: "2.5",
  display: "flex",
  fontSize: "sm",
  paddingBlock: "3",
  paddingInline: "1",
  "&:last-child": {
    borderBlockEndWidth: "none",
    paddingBlockEnd: "0",
  },
});

export const passkeyRowIcon = css({
  color: "fg.muted",
  display: "inline-flex",
  flexShrink: "0",
});

export const passkeyRowBody = css({
  display: "flex",
  flexDirection: "column",
  flex: "1",
  minInlineSize: "0",
  rowGap: "0.5",
});

export const passkeyRowName = css({
  color: "fg.default",
  fontWeight: "semibold",
  margin: "0",
  overflowWrap: "anywhere",
});

export const passkeyRowMeta = css({
  color: "fg.muted",
  fontFamily: "mono",
  fontSize: "2xs",
  margin: "0",
});

export const passkeyRowOps = css({
  columnGap: "1",
  display: "flex",
  flexShrink: "0",
  marginInlineStart: "auto",
});

/** パスキー0件の中央メッセージ。 */
export const passkeyEmpty = css({
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
  paddingBlock: "5",
  rowGap: "2",
  textAlign: "center",
});

export const passkeyEmptyIcon = css({
  alignItems: "center",
  background: "surface.muted",
  borderRadius: "full",
  color: "fg.muted",
  display: "inline-flex",
  blockSize: "[2.5rem]",
  inlineSize: "[2.5rem]",
  justifyContent: "center",
});

export const passkeyEmptyTitle = css({
  color: "fg.default",
  fontSize: "sm",
  fontWeight: "semibold",
  margin: "0",
});

export const passkeyEmptyNote = css({
  color: "fg.muted",
  fontSize: "xs",
  margin: "0",
});

export const passkeyEmptyAction = css({
  marginBlockStart: "2.5",
});
