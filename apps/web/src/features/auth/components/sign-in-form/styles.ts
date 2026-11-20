import { css } from "styled-system/css";

export const signInForm = css({
  marginBlockStart: "1",
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

export const passwordWrap = css({
  alignItems: "center",
  display: "flex",
  position: "relative",
});

export const passwordInput = css({
  paddingInlineEnd: "11",
});

export const passwordToggle = css({
  "@media (hover: hover) and (pointer: fine)": {
    "&:hover": {
      background: "surface.muted",
      color: "fg.default",
    },
  },
  "@media (pointer: coarse)": {
    minBlockSize: "touch",
    minInlineSize: "touch",
    insetInlineEnd: "0",
  },
  alignItems: "center",
  background: "transparent",
  borderRadius: "box",
  borderWidth: "none",
  color: "fg.muted",
  cursor: "pointer",
  display: "inline-flex",
  insetInlineEnd: "1.5",
  justifyContent: "center",
  minBlockSize: "[2rem]",
  minInlineSize: "[2rem]",
  position: "absolute",
  transitionDuration: "hover",
  transitionProperty: "background-color, color",
  _focusVisible: {
    outline: "2px solid token(colors.accent.solid)",
    outlineOffset: "2px",
  },
});
