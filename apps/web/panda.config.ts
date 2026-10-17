import { defineConfig } from "@pandacss/dev";

import { colors } from "./panda/colors";
import { globalCss } from "./panda/global-css";
import { animationStyles, keyframes, motion } from "./panda/motion";
import { semanticColors } from "./panda/semantic-colors";
import { shadows } from "./panda/shadows";
import { shape } from "./panda/shape";
import { sizes } from "./panda/sizes";
import { typography } from "./panda/typography";

export default defineConfig({
  exclude: [],

  globalCss,

  include: ["./src/**/*.{ts,tsx}"],

  jsxFramework: "react",

  outdir: "styled-system",

  preflight: false,

  strictPropertyValues: false,

  strictTokens: false,

  theme: {
    extend: {
      animationStyles,
      keyframes,
      semanticTokens: semanticColors,
      tokens: {
        ...colors,
        ...motion,
        ...shadows,
        ...shape,
        ...sizes,
        ...typography,
      },
    },
  },

  validation: "error",
});
