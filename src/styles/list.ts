import { css, cva } from "styled-system/css";

export const listHead = css({
  alignItems: "center",
  columnGap: "3",
  display: "flex",
  paddingBlockEnd: "2.5",
  paddingBlockStart: "4.5",
  paddingInline: "4",
});

export const listTitle = css({
  fontSize: "lg",
  fontWeight: "bold",
  letterSpacing: "-0.01em",
});

export const listSub = css({
  color: "fg.faint",
  fontFamily: "mono",
  fontSize: "2xs",
});

export const listTools = css({
  columnGap: "1.5",
  display: "flex",
  marginInlineStart: "auto",
});

export const rows = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  minBlockSize: "0",
  overflowY: "auto",
  paddingInline: "1.5",
});

export const rowLink = cva({
  base: {
    alignItems: "center",
    color: "fg.default",
    display: "flex",
    textDecoration: "none",
  },
  variants: {
    layout: {
      desktop: {
        borderRadius: "[0.5625rem]",
        blockSize: "[2.875rem]",
        columnGap: "3",
        display: { base: "none", md: "flex" },
        fontSize: "sm",
        paddingInline: "3",
      },
      mobile: {
        borderRadius: "0.75rem",
        columnGap: "[0.6875rem]",
        display: { base: "flex", md: "none" },
        minBlockSize: "3.5rem",
        paddingBlock: "[0.5625rem]",
        paddingInline: "2.5",
      },
    },
    selected: {
      true: {
        background: "accent.subtle",
      },
    },
  },
  defaultVariants: {
    layout: "desktop",
  },
});

export const rowHover = css({
  _hover: {
    background: "surface.muted",
  },
});

export const rowTitle = css({
  fontWeight: "semibold",
  minInlineSize: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const rowDomain = css({
  color: "fg.faint",
  flexShrink: "0",
  fontFamily: "mono",
  fontSize: "2xs",
  whiteSpace: "nowrap",
});

export const rowTags = css({
  alignItems: "center",
  columnGap: "1.5",
  display: "flex",
  flexShrink: "0",
  marginInlineStart: "auto",
});

export const rowDate = css({
  color: "fg.faint",
  flexShrink: "0",
  fontFamily: "mono",
  fontSize: "2xs",
  inlineSize: "[3.25rem]",
  textAlign: "end",
});

export const rowStar = css({
  color: "star.solid",
  flexShrink: "0",
  display: "flex",
});

export const rowMain = css({
  display: "flex",
  flexDirection: "column",
  minInlineSize: "0",
  rowGap: "[0.25rem]",
});

export const rowTitleMobile = css({
  fontSize: "sm",
  fontWeight: "semibold",
  lineClamp: 2,
  lineHeight: "1.35",
});

export const rowMeta = css({
  alignItems: "center",
  color: "fg.faint",
  columnGap: "1.5",
  display: "flex",
  fontFamily: "mono",
  fontSize: "2xs",
  minInlineSize: "0",
});

export const rowMetaDots = css({
  alignItems: "center",
  columnGap: "[0.3125rem]",
  display: "flex",
  flexShrink: "0",
});

export const rowMetaDot = css({
  borderRadius: "full",
  blockSize: "[0.4375rem]",
  inlineSize: "[0.4375rem]",
});

export const quickAddStrip = css({
  alignItems: "center",
  background: "bg.surface",
  border: "1px dashed token(colors.border.default)",
  borderRadius: "[0.5625rem]",
  color: "fg.faint",
  columnGap: "2.5",
  display: "flex",
  fontSize: "xs",
  marginBlockEnd: "2.5",
  marginInline: "4",
  paddingBlock: "2",
  paddingInline: "3.5",
  textDecoration: "none",
});

export const quickAddBadge = css({
  alignItems: "center",
  background: "accent.solid",
  borderRadius: "[0.375rem]",
  blockSize: "[1.125rem]",
  color: "accent.fg",
  display: "flex",
  flexShrink: "0",
  inlineSize: "[1.125rem]",
  justifyContent: "center",
});

export const inboxCallout = css({
  alignItems: "center",
  background:
    "linear-gradient(115deg, token(colors.pantry.inboxStart), token(colors.pantry.inboxEnd))",
  borderRadius: "0.75rem",
  columnGap: "3",
  display: "flex",
  marginBlockEnd: "3",
  marginInline: "4",
  paddingBlock: "[0.6875rem]",
  paddingInline: "4",
});

export const inboxBadge = css({
  alignItems: "center",
  background: "bg.surface",
  borderRadius: "[0.625rem]",
  blockSize: "[2.125rem]",
  boxShadow: "[0 1px 3px rgba(0,0,0,0.08)]",
  color: "pantry.inboxFg",
  display: "flex",
  flexShrink: "0",
  inlineSize: "[2.125rem]",
  justifyContent: "center",
});

export const inboxTitle = css({
  fontSize: "sm",
  fontWeight: "bold",
});

export const inboxSub = css({
  color: "pantry.inboxSub",
  fontSize: "2xs",
});

export const inboxAction = css({
  alignItems: "center",
  background: "fg.default",
  borderRadius: "full",
  color: "bg.canvas",
  columnGap: "1.5",
  display: "flex",
  flexShrink: "0",
  fontSize: "2xs",
  fontWeight: "bold",
  marginInlineStart: "auto",
  paddingBlock: "[0.4375rem]",
  paddingInline: "[0.8125rem]",
  textDecoration: "none",
  whiteSpace: "nowrap",
});

export const listBanner = css({
  alignItems: "center",
  background: "danger.surface",
  borderRadius: "[0.5625rem]",
  color: "danger.solid",
  columnGap: "2.5",
  display: "flex",
  fontSize: "xs",
  marginBlockEnd: "2.5",
  marginInline: "4",
  paddingBlock: "2",
  paddingInline: "3.5",
});

export const listBannerAction = css({
  alignItems: "center",
  appearance: "none",
  background: "none",
  border: "none",
  color: "danger.solid",
  columnGap: "1",
  cursor: "pointer",
  display: "flex",
  flexShrink: "0",
  font: "inherit",
  fontWeight: "bold",
  marginInlineStart: "auto",
  padding: "0",
  whiteSpace: "nowrap",
});

export const skeletonRow = css({
  alignItems: "center",
  columnGap: "3",
  display: "flex",
  minBlockSize: "[3.5rem]",
  paddingBlock: "[0.5625rem]",
  paddingInline: "2.5",
  md: {
    blockSize: "[2.875rem]",
    minBlockSize: "0",
    paddingBlock: "0",
    paddingInline: "3",
  },
});

export const skeletonBody = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  minInlineSize: "0",
  rowGap: "[0.4375rem]",
});
