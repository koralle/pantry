import { css } from "styled-system/css";

export const pageTitle = css({
  fontSize: "title",
  fontWeight: "bold",
  lineHeight: "tight",
  margin: "0",
  textWrap: "pretty",
});

export const pageLead = css({
  color: "fg.muted",
  fontSize: "md2",
  lineHeight: "relaxed",
  margin: "0",
  maxInlineSize: "36rem",
});

export const sectionLabel = css({
  color: "fg.muted",
  fontSize: "xs",
  fontWeight: "semibold",
  margin: "0",
});

export const metaCount = css({
  color: "fg.muted",
  fontSize: "xs",
  fontVariantNumeric: "tabular-nums",
});
