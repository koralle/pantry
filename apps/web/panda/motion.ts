import {
  defineAnimationStyles,
  defineKeyframes,
  defineTokens,
} from "@pandacss/dev";

export const motion = defineTokens({
  durations: {
    press: { value: "120ms" },
    crossfade: { value: "160ms" },
    hover: { value: "180ms" },
    fadeUp: { value: "200ms" },
    spin: { value: "1s" },
    skeleton: { value: "1.2s" },
  },
  easings: {
    press: { value: "cubic-bezier(0.16, 1, 0.3, 1)" },
  },
});

export const keyframes = defineKeyframes({
  crossfade: {
    from: { opacity: "0" },
    to: { opacity: "1" },
  },
  fadeUp: {
    from: { opacity: "0", transform: "translateY(0.375rem)" },
    to: { opacity: "1", transform: "translateY(0)" },
  },
  skeletonPulse: {
    "0%": { backgroundPosition: "100% 0" },
    "100%": { backgroundPosition: "-100% 0" },
  },
});

export const animationStyles = defineAnimationStyles({
  crossfade: {
    value: {
      animationDuration: "crossfade",
      animationFillMode: "both",
      animationName: "crossfade",
      animationTimingFunction: "ease-out",
    },
  },
  fadeUp: {
    value: {
      animationDuration: "fadeUp",
      animationFillMode: "both",
      animationName: "fadeUp",
      animationTimingFunction: "ease-out",
    },
  },
  skeleton: {
    value: {
      animationDuration: "skeleton",
      animationIterationCount: "infinite",
      animationName: "skeletonPulse",
      animationTimingFunction: "ease-in-out",
    },
  },
});
