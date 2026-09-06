import { css } from "styled-system/css";

export const surface = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
});

export const interactiveSurface = css({
  "@media (any-hover: hover)": {
    "&:hover": {
      background: "accent.hover",
      borderColor: "border.accent",
    },
  },
  transitionDuration: "hover",
  transitionProperty: "border-color, background-color",
  transitionTimingFunction: "press",
});
