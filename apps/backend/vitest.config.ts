import { defineConfig } from "vitest/config"

export default defineConfig(async () => ({
  test: {
    name: "unittest",
    globals: true,
  },
}))
