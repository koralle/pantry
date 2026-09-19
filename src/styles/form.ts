import { css } from "styled-system/css";

/** フォーム送信エラーのコールアウト。アイコン列 + 本文列の2カラム構造。 */
export const formSummary = css({
  alignItems: "flex-start",
  background: "danger.surface",
  borderColor: "danger.border",
  borderRadius: "sheet",
  borderStyle: "solid",
  borderWidth: "thin",
  columnGap: "2.5",
  display: "flex",
  paddingBlock: "3.5",
  paddingInline: "4",
});

export const formSummaryIcon = css({
  color: "danger.solid",
  flexShrink: "0",
  marginBlockStart: "[0.125rem]",
});

export const formSummaryBody = css({
  display: "flex",
  flexDirection: "column",
  minInlineSize: "0",
  rowGap: "1.5",
});

export const formSummaryTitle = css({
  color: "danger.solid",
  fontSize: "xs",
  fontWeight: "semibold",
  lineHeight: "tight",
  margin: "0",
});

export const formSummaryText = css({
  fontSize: "xs",
  margin: "0",
});

export const formSummaryList = css({
  "& > li": {
    paddingInlineStart: "3",
    position: "relative",
  },
  "& > li::before": {
    color: "danger.solid",
    content: "'•'",
    insetInlineStart: "0",
    position: "absolute",
  },
  display: "flex",
  flexDirection: "column",
  fontSize: "xs2",
  listStyle: "none",
  margin: "0",
  padding: "0",
  rowGap: "1",
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
  alignItems: "center",
  color: "danger.solid",
  columnGap: "1.5",
  display: "flex",
  fontSize: "xs",
  margin: "0",
});
