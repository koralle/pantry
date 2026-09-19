import { defineTokens } from "@pandacss/dev";

export const colors = defineTokens({
  colors: {
    pantry: {
      canvas: { value: "#f4f5f4" },
      ink: { value: "#1a2024" },
      muted: { value: "#4f5a61" },
      faint: { value: "#9aa5ab" },
      line: { value: "#e3e7e5" },
      accent: { value: "#0f766e" },
      accentSoft: { value: "#e5f3f1" },
      surface: { value: "#ffffff" },
      surfaceMuted: { value: "#fafbfa" },
      star: { value: "#e8a013" },
      danger: { value: "#b91c1c" },
      dangerSoft: { value: "#fdeeee" },
      inboxStart: { value: "#fff8ea" },
      inboxEnd: { value: "#fdf0d4" },
      inboxFg: { value: "#b07d2b" },
      inboxSub: { value: "#8a6d3b" },
    },
    domain: {
      teal: { value: "#14b8a6" },
      blue: { value: "#3b82f6" },
      violet: { value: "#8b5cf6" },
      pink: { value: "#ec4899" },
      green: { value: "#22c55e" },
      orange: { value: "#f97316" },
      yellow: { value: "#eab308" },
      slate: { value: "#64748b" },
    },
  },
});
