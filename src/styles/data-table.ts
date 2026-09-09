import { css } from "styled-system/css";

export const dataTableWrap = css({
  inlineSize: "100%",
  minInlineSize: "0",
});

export const dataTable = css({
  borderCollapse: "collapse",
  tableLayout: "fixed",
  width: "full",
});

export const dataTableCell = css({
  borderBlockEndColor: "border.default",
  borderBlockEndStyle: "solid",
  borderBlockEndWidth: "thin",
  paddingBlock: "2.5",
  paddingInline: "3",
  textAlign: "start",
  verticalAlign: "middle",
});

export const dataTableHeadCell = css({
  color: "fg.muted",
  fontSize: "2xs",
  fontWeight: "semibold",
  letterSpacing: "wide",
  paddingBlock: "2",
  whiteSpace: "nowrap",
});

export const dataTableRow = css({
  "@media (any-hover: hover)": {
    "&:hover": {
      background: "accent.hover",
    },
  },
  background: "bg.surface",
  position: "relative",
  transitionDuration: "hover",
  transitionProperty: "background-color",
  transitionTimingFunction: "press",
});

export const dataTableRowLink = css({
  "&::after": {
    content: '""',
    inset: "0",
    position: "absolute",
    zIndex: "1",
  },
  "&:focus-visible::after": {
    outlineColor: "accent.solid",
    outlineOffset: "-2px",
    outlineStyle: "solid",
    outlineWidth: "medium",
  },
  "@media (any-hover: hover)": {
    "&:hover": {
      textDecoration: "none",
    },
  },
  _focusVisible: {
    outline: "none",
  },
  color: "fg.default",
  fontWeight: "semibold",
  textDecoration: "none",
});
