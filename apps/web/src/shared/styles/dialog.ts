import { css } from "styled-system/css";

export const dialogBackdrop = css({
  backdropFilter: "blur(4px)",
  background: "overlay.backdrop",
  inset: "0",
  position: "fixed",
  zIndex: "20",
  "@media (prefers-reduced-motion: no-preference)": {
    transitionDuration: "modal",
    transitionProperty: "opacity",
    transitionTimingFunction: "out",
    "&[data-entering]": {
      opacity: "0",
    },
    "&[data-exiting]": {
      opacity: "0",
      transitionDuration: "modalExit",
    },
  },
});

/**
 * 中央モーダル。子要素は uniform gap ではなく各ブロックの
 * marginBlockStart でリズムを作る。
 */
export const dialog = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "sheet",
  borderStyle: "solid",
  borderWidth: "thin",
  boxShadow: "dialog",
  blockSize: "fit-content",
  boxSizing: "border-box",
  inset: "0",
  margin: "auto",
  maxBlockSize: "calc(100dvh - 2rem)",
  maxInlineSize: "min(26rem, calc(100vw - 2rem))",
  overflowY: "auto",
  overscrollBehavior: "contain",
  padding: "6",
  position: "fixed",
  width: "dialog-width",
  "@media (prefers-reduced-motion: no-preference)": {
    transitionDuration: "modal",
    transitionProperty: "opacity, transform",
    transitionTimingFunction: "out",
    "&[data-entering]": {
      opacity: "0",
      transform: "scale(0.96) translateY(0.25rem)",
    },
    "&[data-exiting]": {
      opacity: "0",
      transform: "scale(0.96) translateY(0.25rem)",
      transitionDuration: "modalExit",
    },
  },
});

export const dialogTitle = css({
  color: "fg.default",
  fontSize: "md",
  fontWeight: "bold",
  lineHeight: "tight",
  margin: "0",
});

export const dialogDescription = css({
  color: "fg.muted",
  fontSize: "xs",
  lineHeight: "body",
  margin: "0",
  marginBlockStart: "2",
});

export const dialogField = css({
  display: "flex",
  flexDirection: "column",
  marginBlockStart: "3",
  rowGap: "1.5",
});

export const dialogError = css({
  alignItems: "center",
  color: "danger.solid",
  columnGap: "1.5",
  display: "flex",
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
