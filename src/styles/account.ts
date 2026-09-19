import { css } from "styled-system/css";

/** アカウント画面全体。shell main の中で縦スクロールを持つ。 */
export const accountPage = css({
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

export const accountPageInner = css({
  display: "flex",
  flexDirection: "column",
  maxInlineSize: "[35rem]",
  minBlockSize: "0",
  inlineSize: "100%",
});

export const accountTitle = css({
  fontSize: "[1.0625rem]",
  fontWeight: "bold",
  letterSpacing: "tight",
  margin: "0",
});

/** mobile 上部の `← 一覧へ戻る`。desktop はレールがあるので出さない。 */
export const accountBackRow = css({
  display: { base: "flex", md: "none" },
  marginBlockEnd: "3",
});

/** モックの `.sec-box` — セクション区切りの上罫線。 */
export const accountSection = css({
  borderBlockStartColor: "border.default",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "thin",
  marginBlockStart: "4.5",
  paddingBlockStart: "3.5",
});

/** モックの `.sec-h` — セクション見出し。 */
export const accountSectionHeading = css({
  color: "fg.faint",
  fontSize: "2xs",
  fontWeight: "bold",
  letterSpacing: "[0.06em]",
  margin: "0",
  textTransform: "uppercase",
});

/** 見出しと中身の間隔（`.sec-h` の margin-bottom 相当）。 */
export const accountSectionBody = css({
  marginBlockStart: "3",
});

/** `パスキー` 見出し + 右端の `追加` アクションの行。 */
export const accountSectionHeadRow = css({
  alignItems: "center",
  display: "flex",
});

export const accountSectionHeadAction = css({
  marginInlineStart: "auto",
});

/** モックの `.kv` — 名前/メールの表示行。 */
export const accountKv = css({
  columnGap: "3.5",
  display: "flex",
  fontSize: "sm",
  margin: "0",
  paddingBlock: "2",
});

export const accountKvKey = css({
  color: "fg.faint",
  flexShrink: "0",
  fontSize: "2xs",
  inlineSize: "[4.5rem]",
  paddingBlockStart: "px",
});

export const accountKvValue = css({
  color: "fg.default",
  margin: "0",
  overflowWrap: "anywhere",
});

/** モックの `.pk-row` — パスキー行。 */
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
});

export const passkeyRowIcon = css({
  color: "fg.faint",
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
  fontWeight: "semibold",
  margin: "0",
  overflowWrap: "anywhere",
});

export const passkeyRowMeta = css({
  color: "fg.faint",
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
  color: "fg.faint",
  display: "inline-flex",
  blockSize: "[2.5rem]",
  inlineSize: "[2.5rem]",
  justifyContent: "center",
});

export const passkeyEmptyTitle = css({
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
