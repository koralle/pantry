import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    globalSetup: ["./src/test/persistence/global-setup.ts"],
    hookTimeout: 120_000,
    include: ["src/test/persistence/**/*.integration.test.ts"],
    maxWorkers: 1,
    name: "persistence-integration",
    reporters:
      process.env["GITHUB_ACTIONS"] === "true"
        ? ["minimal", "github-actions"]
        : ["minimal"],
    testTimeout: 30_000,
  },
});
