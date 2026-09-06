import { css } from "styled-system/css";

export { pageLead as workbenchLead, pageTitle as workbenchTitle } from "./type";
export const workbench = css({
  display: "flex",
  flexDirection: "column",
  gap: "5",
  maxInlineSize: "36rem",
});

export const workbenchNav = css({
  columnGap: "5",
  display: "flex",
  flexWrap: "wrap",
  rowGap: "3",
});

export const workbenchForm = css({
  display: "flex",
  flexDirection: "column",
  gap: "5",
});

export const workbenchFields = css({
  borderWidth: "none",
  display: "flex",
  flexDirection: "column",
  gap: "4",
  margin: "0",
  minInlineSize: "0",
  padding: "0",
});
