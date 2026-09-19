import { css } from "styled-system/css";

export const dialogBackdrop = css({
  background: "overlay.backdrop",
  inset: "0",
  position: "fixed",
});

/**
 * 中央モーダル。子要素は uniform gap ではなく各ブロックの
 * marginBlockStart でリズムを作る（モック: 説明 +6px / フィールド +12px /
 * アクション +14〜16px）。
 */
export const dialog = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "sheet",
  borderStyle: "solid",
  borderWidth: "thin",
  boxShadow: "dialog",
  boxSizing: "border-box",
  inset: "0",
  margin: "auto",
  maxInlineSize: "20rem",
  padding: "4.5",
  position: "fixed",
  width: "dialog-width",
});

export const dialogTitle = css({
  fontSize: "xs",
  fontWeight: "bold",
  lineHeight: "tight",
  margin: "0",
});

export const dialogDescription = css({
  color: "fg.muted",
  fontSize: "2xs",
  lineHeight: "[1.6]",
  margin: "0",
  marginBlockStart: "1.5",
});

export const dialogField = css({
  display: "flex",
  flexDirection: "column",
  marginBlockStart: "3",
  rowGap: "1.5",
});

export const dialogError = css({
  color: "danger.solid",
  fontSize: "2xs",
  margin: "0",
  marginBlockStart: "2",
});

export const dialogActions = css({
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
  justifyContent: "flex-end",
  marginBlockStart: "3.5",
});
