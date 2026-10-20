import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    globalSetup: ["./src/test/db/global-setup.ts"],
    hookTimeout: 120_000,
    include: ["src/test/db/**/*.integration.test.ts"],
    maxWorkers: 1,
    name: "db",
    reporters:
      process.env["GITHUB_ACTIONS"] === "true"
        ? ["minimal", "github-actions"]
        : ["minimal"],
    testTimeout: 30_000,
  },
});
