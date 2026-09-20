import { css } from "styled-system/css";

/**
 * クイック追加ミニ画面のカード。フォーム（幅いっぱいの縦積み）より小さい
 * 枠付きカードを中央に置く。入力 → 取得 → 確認 → 完了の全状態がこの中で変わる。
 */
export const qaCard = css({
  alignSelf: "flex-start",
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "[1rem]",
  borderStyle: "solid",
  borderWidth: "thin",
  inlineSize: "100%",
  maxInlineSize: "[25rem]",
  padding: "[1.375rem]",
});

export const qaHead = css({
  alignItems: "center",
  columnGap: "2.5",
  display: "flex",
});

/** アイコンを乗せる accent-soft の丸バッジ。 */
export const qaBadge = css({
  alignItems: "center",
  background: "accent.subtle",
  blockSize: "[1.875rem]",
  borderRadius: "full",
  color: "accent.solid",
  display: "inline-flex",
  flexShrink: "0",
  inlineSize: "[1.875rem]",
  justifyContent: "center",
});

export const qaTitle = css({
  fontSize: "sm",
  fontWeight: "extrabold",
  margin: "0",
});

export const qaSub = css({
  color: "fg.muted",
  fontSize: "2xs",
  margin: "0",
  marginBlockStart: "0.5",
});

export const qaBody = css({
  display: "flex",
  flexDirection: "column",
  marginBlockStart: "3.5",
  rowGap: "3",
});

export const qaFieldGroup = css({
  display: "flex",
  flexDirection: "column",
  rowGap: "1.5",
});

/** 取得中の進行表示。破線ボックス + スピナー + 一文。 */
export const qaFetchRow = css({
  alignItems: "center",
  background: "surface.muted",
  borderColor: "border.default",
  borderRadius: "[0.75rem]",
  borderStyle: "dashed",
  borderWidth: "thin",
  color: "fg.muted",
  columnGap: "2.5",
  display: "flex",
  fontSize: "xs",
  padding: "3",
});

/** タイトル取得失敗の警告ノート（ amber 系 = inbox トーンを再利用）。 */
export const qaWarnNote = css({
  alignItems: "flex-start",
  background: "pantry.inboxStart",
  borderRadius: "[0.5rem]",
  color: "pantry.inboxSub",
  columnGap: "1.5",
  display: "flex",
  fontSize: "2xs",
  lineHeight: "relaxed",
  paddingBlock: "2",
  paddingInline: "2.5",
});

export const qaWarnNoteIcon = css({
  flexShrink: "0",
  marginBlockStart: "[0.125rem]",
});

/** 保存失敗のエラーノート。 */
export const qaErrNote = css({
  alignItems: "flex-start",
  background: "danger.surface",
  borderRadius: "[0.5rem]",
  color: "danger.solid",
  columnGap: "1.5",
  display: "flex",
  fontSize: "2xs",
  lineHeight: "relaxed",
  paddingBlock: "2",
  paddingInline: "2.5",
});

/** 確認・完了状態で保存対象を示すブックマーク行。 */
export const qaBookmark = css({
  alignItems: "center",
  background: "surface.muted",
  borderColor: "border.default",
  borderRadius: "[0.75rem]",
  borderStyle: "solid",
  borderWidth: "thin",
  columnGap: "2.5",
  display: "flex",
  paddingBlock: "2.5",
  paddingInline: "3",
});

export const qaBookmarkTx = css({
  flex: "1",
  minInlineSize: "0",
});

export const qaBookmarkTitle = css({
  fontSize: "xs",
  fontWeight: "bold",
  lineHeight: "snug",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const qaBookmarkMeta = css({
  alignItems: "center",
  color: "fg.faint",
  columnGap: "2",
  display: "flex",
  fontFamily: "mono",
  fontSize: "[0.625rem]",
  marginBlockStart: "0.5",
});

export const qaTagDots = css({
  alignItems: "center",
  columnGap: "0.75",
  display: "inline-flex",
});

export const qaTagDot = css({
  blockSize: "[0.375rem]",
  borderRadius: "full",
  display: "block",
  inlineSize: "[0.375rem]",
});

/** 完了行の右端に置く「タグを編集」リンク。 */
export const qaEditTagLink = css({
  alignItems: "center",
  borderColor: "border.accent",
  borderRadius: "[0.4375rem]",
  borderStyle: "solid",
  borderWidth: "thin",
  color: "accent.solid",
  columnGap: "1.25",
  display: "inline-flex",
  flexShrink: "0",
  fontSize: "2xs",
  fontWeight: "bold",
  paddingBlock: "1.5",
  paddingInline: "2.5",
  textDecoration: "none",
  whiteSpace: "nowrap",
});

/** 下部アクション行。ボタンは均等割り（主ボタンをやや広く）。 */
export const qaActions = css({
  columnGap: "2.5",
  display: "flex",
  marginBlockStart: "4",
  "& > *": {
    flex: "1",
  },
  "& > [data-primary]": {
    flex: "1.4",
  },
});
