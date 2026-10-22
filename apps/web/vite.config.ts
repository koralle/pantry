import path from "node:path";

import { cloudflare } from "@cloudflare/vite-plugin";
import { workerVars } from "@pantry/env";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiRoot = path.resolve(import.meta.dirname, "../api");

/**
 * `vite dev` で pantry-api を auxiliary worker として同時に起動し、`env.API` の
 * Service Binding を本物の api に繋ぐ。api の vars は apps/api の vite config を
 * 通らない（auxiliary worker は web の dev サーバーが起動する）ため、ここで
 * packages/env の値を読んで渡す。
 */
const apiAuxiliaryWorker = () => ({
  config: { vars: workerVars() },
  configPath: path.join(apiRoot, "wrangler.jsonc"),
});

const config = defineConfig(({ command }) => ({
  plugins: [
    devtools(),
    cloudflare({
      viteEnvironment: { name: "ssr" },
      // build では api を同梱しない。api は apps/api から別にデプロイする。
      ...(command === "serve"
        ? { auxiliaryWorkers: [apiAuxiliaryWorker()] }
        : {}),
    }),
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
}));

export default config;
