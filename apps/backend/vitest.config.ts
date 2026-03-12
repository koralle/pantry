import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  resolve: {
    alias: [{ find: /^zod$/, replacement: "zod/v4" }],
  },
  test: {
    globals: true,
    poolOptions: {
      workers: {
        wrangler: {
          configPath: "./wrangler.jsonc",
        },
      },
    },
  },
});
