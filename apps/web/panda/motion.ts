import {
  defineAnimationStyles,
  defineKeyframes,
  defineTokens,
} from "@pandacss/dev";

export const motion = defineTokens({
  durations: {
    press: { value: "130ms" },
    hover: { value: "150ms" },
    crossfade: { value: "160ms" },
    modalExit: { value: "160ms" },
    fadeUp: { value: "200ms" },
    modal: { value: "220ms" },
    spin: { value: "0.75s" },
    skeleton: { value: "1.4s" },
  },
  easings: {
    out: { value: "cubic-bezier(0.23, 1, 0.32, 1)" },
    inOut: { value: "cubic-bezier(0.77, 0, 0.175, 1)" },
    drawer: { value: "cubic-bezier(0.32, 0.72, 0, 1)" },
    press: { value: "cubic-bezier(0.23, 1, 0.32, 1)" },
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
      animationTimingFunction: "out",
    },
  },
  fadeUp: {
    value: {
      animationDuration: "crossfade",
      animationFillMode: "both",
      animationName: "crossfade",
      animationTimingFunction: "out",
      "@media (prefers-reduced-motion: no-preference)": {
        animationDuration: "fadeUp",
        animationName: "fadeUp",
      },
    },
  },
  skeleton: {
    value: {
      "@media (prefers-reduced-motion: no-preference)": {
        animationDuration: "skeleton",
        animationIterationCount: "infinite",
        animationName: "skeletonPulse",
        animationTimingFunction: "ease-in-out",
      },
    },
  },
});
