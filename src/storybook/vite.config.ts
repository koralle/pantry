import path from "node:path";

import { msw } from "msw/vite";
import { defineConfig } from "vite";

const { dirname } = import.meta;

/**
 * Minimal Vite config for Storybook.
 * Intentionally excludes Cloudflare / TanStack Start app plugins.
 * The worker script is served by msw/vite (worker-only) — see ADR 0003.
 */
export default defineConfig({
  plugins: [msw({ mode: "worker-only" })],
  resolve: {
    alias: {
      "styled-system": path.resolve(dirname, "../../styled-system"),
    },
  },
});
