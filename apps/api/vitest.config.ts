import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

/**
 * Libsql の `:memory:` は workerd で動かないため、実 DB を使うテストは
 * Node project へ逃がす（apps/web の vitest.config.ts と同じ構成）。
 */
const anyIntegrationTests = "src/**/*.integration.test.ts";
/** Docker（testcontainers）が要るので通常の test では回さない。 */
const persistenceTests = "src/test/persistence/**";

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [
          cloudflareTest({
            wrangler: { configPath: "./wrangler.jsonc" },
          }),
        ],
        test: {
          exclude: [anyIntegrationTests],
          include: ["src/**/*.{test,spec}.ts"],
          name: "workers",
        },
      },
      {
        test: {
          environment: "node",
          exclude: [persistenceTests],
          include: [anyIntegrationTests],
          name: "node",
        },
      },
    ],
    reporters:
      process.env["GITHUB_ACTIONS"] === "true"
        ? ["minimal", "github-actions"]
        : ["minimal"],
  },
});
