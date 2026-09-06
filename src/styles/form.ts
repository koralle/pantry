import { css } from "styled-system/css";

export const formSummary = css({
  background: "danger.surface",
  borderColor: "danger.border",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  paddingBlock: "3.5",
  paddingInline: "4",
});

export const formSummaryTitle = css({
  fontWeight: "semibold",
  margin: "0",
  marginBlockEnd: "1.5",
});

export const formSummaryList = css({
  margin: "0",
  paddingInlineStart: "5",
});

export const field = css({
  display: "flex",
  flexDirection: "column",
  gap: "1.5",
});

export const fieldLabel = css({
  fontSize: "xs",
  fontWeight: "semibold",
});

export const fieldUrlRow = css({
  "& > :first-child": {
    flex: "1",
    minInlineSize: "12rem",
  },
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
});

export const fieldError = css({
  color: "danger.solid",
  fontSize: "xs",
  margin: "0",
});
