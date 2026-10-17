import path from "node:path";

import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { varlockCloudflareVitePlugin } from "@varlock/cloudflare-integration";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
  plugins: [
    devtools(),
    varlockCloudflareVitePlugin({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({
      router: {
        // Colocated Storybook and test files are not routes.
        routeFileIgnorePattern: "\\.(stories|test)\\.(tsx|ts|jsx|js)$",
      },
    }),
    viteReact(),
  ],
  resolve: {
    alias: {
      "styled-system": path.resolve(import.meta.dirname, "styled-system"),
    },
  },
});

export default config;
