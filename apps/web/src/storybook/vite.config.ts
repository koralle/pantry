import path from "node:path";

import { defineConfig } from "vite";

const { dirname } = import.meta;

/**
 * Minimal Vite config for Storybook.
 * Intentionally excludes Cloudflare / TanStack Start app plugins.
 */
export default defineConfig({
  resolve: {
    alias: {
      "styled-system": path.resolve(dirname, "../../styled-system"),
    },
  },
});
