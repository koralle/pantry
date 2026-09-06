import { css } from "styled-system/css";

export const skeleton = css({
  animationStyle: "skeleton",
  backgroundImage:
    "linear-gradient(90deg, {colors.skeleton.start} 0%, {colors.skeleton.middle} 50%, {colors.skeleton.start} 100%)",
  backgroundSize: "200% 100%",
  borderColor: "border.default",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  color: "fg.muted",
  paddingBlock: "6",
  paddingInline: "4",
});

export const spinner = css({
  animationDuration: "spin",
  animationIterationCount: "infinite",
  animationName: "spin",
  animationTimingFunction: "linear",
});

export const stateBox = css({
  borderColor: "border.default",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  paddingBlock: "6",
  paddingInline: "5",
  textAlign: "center",
});

export const stateMessage = css({
  color: "fg.muted",
  margin: "0",
  marginBlockEnd: "3",
});

export const stateErrorMessage = css({
  color: "fg.default",
  margin: "0",
  marginBlockEnd: "3",
});
