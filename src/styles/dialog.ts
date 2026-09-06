import { css } from "styled-system/css";

export const dialogBackdrop = css({
  background: "overlay.backdrop",
  inset: "0",
  position: "fixed",
});

export const dialog = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: "3",
  height: "fit",
  inset: "0",
  margin: "auto",
  maxInlineSize: "24rem",
  padding: "5",
  position: "fixed",
  width: "dialog-width",
});

export const dialogTitle = css({
  fontSize: "md",
  margin: "0",
});

export const dialogActions = css({
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: "3",
});
