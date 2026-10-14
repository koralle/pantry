import { css } from "styled-system/css";

export const statusMessage = css({
  color: "fg.muted",
  fontSize: "xs",
  margin: "0",
});

/** タグ入力ボックス内のピッカー起動ボタン。旧 input と同じ位置・大きさを占める。 */
export const trigger = css({
  alignItems: "center",
  background: "transparent",
  borderWidth: "none",
  color: "fg.faint",
  cursor: "pointer",
  display: "inline-flex",
  flex: "1",
  fontFamily: "inherit",
  fontSize: "xs",
  justifyContent: "flex-start",
  minInlineSize: "[5rem]",
  outline: "none",
  paddingBlock: "0.5",
  paddingInline: "0.5",
  whiteSpace: "nowrap",
});

/**
 * モバイルは下端シート、md 以上は中央ダイアログ。同じ Modal を
 * 見た目だけ切り替える（dismiss・フォーカスは RAC に任せる）。
 */
export const backdrop = css({
  alignItems: "flex-end",
  background: "overlay.backdrop",
  display: "flex",
  inset: "0",
  justifyContent: "center",
  position: "fixed",
  zIndex: "20",
  md: {
    alignItems: "center",
    padding: "6",
  },
});

export const dialog = css({
  background: "bg.canvas",
  borderBlockStartColor: "border.default",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "thin",
  borderTopLeftRadius: "sheet",
  borderTopRightRadius: "sheet",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  maxBlockSize: "85dvh",
  overflow: "hidden",
  paddingBlockEnd: "5",
  paddingBlockStart: "4",
  paddingInline: "3",
  width: "full",
  md: {
    borderColor: "border.default",
    borderRadius: "sheet",
    borderStyle: "solid",
    borderWidth: "thin",
    maxBlockSize: "[min(85dvh, 34rem)]",
    maxInlineSize: "[26rem]",
    paddingBlockEnd: "4",
  },
});

/** 高さの連鎖を作る。これが無いと内側のリストがスクロールしない。 */
export const dialogBody = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  minBlockSize: "0",
  overflow: "hidden",
});

export const dialogHeader = css({
  alignItems: "center",
  display: "flex",
  flexShrink: "0",
  gap: "3",
  justifyContent: "space-between",
  marginBlockEnd: "3",
});

export const dialogTitle = css({
  fontSize: "md2",
  fontWeight: "bold",
  margin: "0",
});

export const panel = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  gap: "2",
  minBlockSize: "0",
  overflow: "hidden",
});

export const candidateList = css({
  flex: "1",
  margin: "0",
  minBlockSize: "0",
  outline: "none",
  overflow: "auto",
  padding: "0",
});

export const candidateItem = css({
  "&[data-focused]": {
    background: "accent.hover",
  },
  '&[data-selected="true"]': {
    background: "accent.subtle",
    fontWeight: "semibold",
  },
  alignItems: "center",
  borderRadius: "box",
  cursor: "pointer",
  display: "flex",
  gap: "2",
  minBlockSize: "touch",
  minInlineSize: "0",
  outline: "none",
  paddingBlock: "2",
  paddingInline: "3",
});

export const candidateName = css({
  flex: "1",
  minInlineSize: "0",
  overflowWrap: "anywhere",
});

export const candidateState = css({
  color: "fg.muted",
  flexShrink: "0",
  fontSize: "xs",
});

export const checkSlot = css({
  blockSize: "4",
  flexShrink: "0",
  inlineSize: "4",
});

export const emptyState = css({
  color: "fg.muted",
  fontSize: "xs",
  paddingBlock: "2",
  paddingInline: "3",
});
