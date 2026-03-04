import { defineConfig } from "vitest/config";

export default defineConfig(async () => ({
  resolve: {
    alias: [{ find: /^zod$/, replacement: "zod/v4" }],
  },
  test: {
    name: "unittest",
    globals: true,
  },
}));
