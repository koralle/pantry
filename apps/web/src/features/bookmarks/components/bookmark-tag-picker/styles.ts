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
  color: "fg.muted",
  cursor: "pointer",
  display: "inline-flex",
  flex: "1",
  fontFamily: "inherit",
  fontSize: "xs",
  justifyContent: "flex-start",
  minBlockSize: "[1.75rem]",
  minInlineSize: "[5rem]",
  outline: "none",
  paddingBlock: "0.5",
  paddingInline: "1",
  whiteSpace: "nowrap",
});

/**
 * モバイルは下端シート、md 以上は中央ダイアログ。同じ Modal を
 * 見た目だけ切り替える（dismiss・フォーカスは RAC に任せる）。
 */
export const backdrop = css({
  alignItems: "flex-end",
  backdropFilter: "blur(4px)",
  background: "overlay.backdrop",
  display: "flex",
  inset: "0",
  justifyContent: "center",
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
  md: {
    alignItems: "center",
    padding: "6",
  },
});

export const dialog = css({
  background: "bg.surface",
  borderBlockStartColor: "border.default",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "thin",
  borderTopLeftRadius: "sheet",
  borderTopRightRadius: "sheet",
  boxShadow: "dialog",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  maxBlockSize: "85dvh",
  overflow: "hidden",
  overscrollBehavior: "contain",
  paddingBlockEnd: "[calc(1.25rem + env(safe-area-inset-bottom, 0px))]",
  paddingBlockStart: "4",
  paddingInline: "4",
  width: "full",
  "@media (prefers-reduced-motion: no-preference)": {
    transitionDuration: "modal",
    transitionProperty: "opacity, transform",
    transitionTimingFunction: "drawer",
    "&[data-entering]": {
      opacity: "0",
      transform: "translateY(1rem)",
      md: {
        transform: "scale(0.96) translateY(0.25rem)",
      },
    },
    "&[data-exiting]": {
      opacity: "0",
      transform: "translateY(1rem)",
      transitionDuration: "modalExit",
      md: {
        transform: "scale(0.96) translateY(0.25rem)",
      },
    },
  },
  md: {
    borderColor: "border.default",
    borderRadius: "sheet",
    borderStyle: "solid",
    borderWidth: "thin",
    maxBlockSize: "[min(85dvh, 34rem)]",
    maxInlineSize: "[28rem]",
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

export const dialogTitleGroup = css({
  alignItems: "center",
  columnGap: "2",
  display: "flex",
  minInlineSize: "0",
});

export const dialogTitle = css({
  color: "fg.default",
  fontSize: "md",
  fontWeight: "bold",
  margin: "0",
});

export const dialogSelectedCount = css({
  background: "accent.subtle",
  borderRadius: "full",
  color: "accent.solid",
  fontFamily: "mono",
  fontSize: "2xs",
  fontWeight: "semibold",
  paddingBlock: "0.5",
  paddingInline: "2",
});

export const panel = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  gap: "2.5",
  minBlockSize: "0",
  overflow: "hidden",
});

export const candidateList = css({
  flex: "1",
  margin: "0",
  minBlockSize: "0",
  outline: "none",
  overflow: "auto",
  overscrollBehavior: "contain",
  padding: "0",
});

export const candidateItem = css({
  "@media (hover: hover) and (pointer: fine)": {
    "&:hover": {
      background: "surface.muted",
    },
  },
  "&[data-focused]": {
    background: "accent.hover",
  },
  '&[data-selected="true"]': {
    background: "accent.subtle",
    fontWeight: "semibold",
    "@media (hover: hover) and (pointer: fine)": {
      "&:hover": {
        background: "accent.subtle",
      },
    },
  },
  alignItems: "center",
  borderRadius: "box",
  color: "fg.default",
  cursor: "pointer",
  display: "flex",
  gap: "2.5",
  minBlockSize: "touch",
  minInlineSize: "0",
  outline: "none",
  paddingBlock: "2",
  paddingInline: "3",
  transitionDuration: "hover",
  transitionProperty: "background-color",
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
