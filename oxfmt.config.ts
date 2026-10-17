import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  ignorePatterns: [
    ...(ultracite.ignorePatterns ?? []),
    ".agents/**",
    "pnpm-lock.yaml",
    "apps/web/src/db/schema/auth-schema.ts",
    "apps/web/src/routeTree.gen.ts",
    "apps/web/worker-configuration.d.ts",
  ],
});
