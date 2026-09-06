import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  ignorePatterns: [
    ...(ultracite.ignorePatterns ?? []),
    ".agents/**",
    "pnpm-lock.yaml",
    "src/db/schema/auth-schema.ts",
    "src/routeTree.gen.ts",
    "worker-configuration.d.ts",
  ],
});
