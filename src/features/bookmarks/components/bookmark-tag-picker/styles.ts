import { css } from "styled-system/css";

export const selectedRow = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
  maxInlineSize: "100%",
  minInlineSize: "0",
});

export const chipButton = css({
  height: "auto",
  justifyContent: "flex-start",
  maxInlineSize: "100%",
  minBlockSize: "touch",
  minInlineSize: "0",
  overflowWrap: "anywhere",
  textAlign: "start",
  whiteSpace: "normal",
});

export const statusMessage = css({
  color: "fg.muted",
  fontSize: "xs",
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
  maxBlockSize: "16rem",
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

export const popover = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  margin: "0",
  maxBlockSize: "24rem",
  maxInlineSize: "24rem",
  minInlineSize: "[min(24rem, var(--trigger-width, 100%))]",
  overflow: "hidden",
  padding: "2",
  zIndex: "20",
});

export const sheetBackdrop = css({
  background: "overlay.backdrop",
  inset: "0",
  position: "fixed",
  zIndex: "20",
});

export const sheet = css({
  background: "bg.canvas",
  borderBlockStartColor: "border.default",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "thin",
  borderTopLeftRadius: "sheet",
  borderTopRightRadius: "sheet",
  borderWidth: "none",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  insetBlockEnd: "0",
  insetInline: "0",
  margin: "0",
  maxBlockSize: "85dvh",
  overflow: "hidden",
  paddingBlockEnd: "5",
  paddingBlockStart: "4",
  paddingInline: "3",
  position: "fixed",
  width: "full",
});

export const sheetHeader = css({
  alignItems: "center",
  display: "flex",
  flexShrink: "0",
  gap: "3",
  justifyContent: "space-between",
  marginBlockEnd: "3",
});

export const sheetTitle = css({
  fontSize: "md2",
  fontWeight: "bold",
  margin: "0",
});

export const sheetList = css({
  maxBlockSize: "none",
});
