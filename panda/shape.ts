import { defineTokens } from "@pandacss/dev";

export const shape = defineTokens({
  borderWidths: {
    none: { value: "0" },
    thin: { value: "1px" },
    medium: { value: "2px" },
    thick: { value: "3px" },
  },
  radii: {
    box: { value: "6px" },
    sheet: { value: "12px" },
    full: { value: "999px" },
  },
});
