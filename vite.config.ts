import path from "node:path";

import { cloudflare } from "@cloudflare/vite-plugin";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
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
