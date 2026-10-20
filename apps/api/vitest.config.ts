import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

/**
 * Libsql の `:memory:` は workerd で動かないため、実 DB を使うテストは
 * Node project へ逃がす（apps/web の vitest.config.ts と同じ構成）。
 */
const anyIntegrationTests = "src/**/*.integration.test.ts";

/**
 * DB の semantics（制約・transaction・soft delete・cursor pagination）、
 * /rpc の procedure behaviour、Better Auth の Cookie セッションを確かめるテスト。
 * Testcontainers で起動した libSQL に本番 migration を適用し、1 つの DB を共有する。
 * file 間で同じ行を見ないよう、db project は直列に実行する。
 */
const dbTests = [
  "src/test/db/**/*.integration.test.ts",
  "src/features/**/db/**/*.integration.test.ts",
  "src/rpc/**/*.integration.test.ts",
  "src/auth/**/*.integration.test.ts",
];

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
          exclude: dbTests,
          include: [anyIntegrationTests],
          name: "node",
        },
      },
      {
        test: {
          environment: "node",
          fileParallelism: false,
          globalSetup: ["./src/test/db/global-setup.ts"],
          hookTimeout: 120_000,
          include: dbTests,
          name: "db",
          testTimeout: 30_000,
        },
      },
    ],
    reporters:
      process.env["GITHUB_ACTIONS"] === "true"
        ? ["minimal", "github-actions"]
        : ["minimal"],
  },
});
