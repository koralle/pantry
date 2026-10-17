import path from "node:path";

import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

const tanstackEntryStub = path.resolve(
  import.meta.dirname,
  "vitest/tanstack-entry-stub.ts"
);
const aliases = {
  "#tanstack-router-entry": tanstackEntryStub,
  "#tanstack-start-entry": tanstackEntryStub,
  "#tanstack-start-plugin-adapters": tanstackEntryStub,
} as const;
/**
 * Libsql の `:memory:` は workerd で動かない。
 * 画面テストはソースを読むだけだが、workers の exclude を足すと Vitest 既定 exclude が消え、
 * `node_modules` まで拾うので、ここへまとめて Node project へ逃がす。
 */
const anyIntegrationTests = "src/**/*.integration.test.ts";
const nodeTests = [
  "src/features/tags/persistence/**/*.test.ts",
  "src/features/bookmarks/persistence/**/*.test.ts",
  "src/routes/_protected/tags/index.test.ts",
  "src/features/tags/hooks/use-touch-tag-last-used.test.ts",
  "src/rpc/source-boundary.test.ts",
  "src/routes/_protected/bookmarks/new/index.test.ts",
  "src/routes/_protected/bookmarks/quick/index.test.ts",
  "src/features/bookmarks/orpc-update.source.test.ts",
  "src/features/bookmarks/components/bookmark-delete-dialog.test.ts",
  "src/features/bookmarks/lib/queries/query-ownership.test.ts",
  "src/features/auth/passkey-plugin-wiring.test.ts",
  "src/features/auth/passkey-ui.source.test.ts",
  "src/features/auth/hooks/use-passkey-sign-in.test.tsx",
  "src/features/auth/hooks/use-email-sign-in.test.tsx",
];

export default defineConfig({
  resolve: {
    alias: aliases,
  },
  // Required so Knip's Vitest plugin registers default test entry globs.
  test: {
    projects: [
      {
        plugins: [
          cloudflareTest({
            // wrangler.jsonc の `API`（pantry-api）はテストでは起動しない。
            // 経路を通るテストは fetch を注入するので、binding 自体は 503 の stub にする。
            // 受けたリクエストを x-stub-* ヘッダーで返し、server.ts の振り分けを確かめる。
            miniflare: {
              serviceBindings: {
                API: (request: Request) =>
                  new Response("pantry-api is not available in tests", {
                    headers: {
                      "x-stub-client-ip":
                        request.headers.get("cf-connecting-ip") ?? "",
                      "x-stub-cookie": request.headers.get("cookie") ?? "",
                      "x-stub-method": request.method,
                      "x-stub-path": new URL(request.url).pathname,
                    },
                    status: 503,
                  }),
              },
            },
            wrangler: { configPath: "./wrangler.jsonc" },
          }),
        ],
        resolve: {
          alias: aliases,
        },
        test: {
          exclude: [...nodeTests, anyIntegrationTests],
          include: ["src/**/*.{test,spec}.ts"],
          name: "workers",
        },
      },
      {
        resolve: {
          alias: aliases,
        },
        test: {
          environment: "node",
          include: nodeTests,
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
