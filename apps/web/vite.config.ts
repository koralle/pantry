import path from "node:path";

import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { varlockCloudflareVitePlugin } from "@varlock/cloudflare-integration";
import viteReact from "@vitejs/plugin-react";
import { execSyncVarlock } from "varlock/exec-sync-varlock";
import { defineConfig } from "vite";

const apiRoot = path.resolve(import.meta.dirname, "../api");

interface VarlockFullGraph {
  readonly config: Record<string, { readonly value?: unknown }>;
  readonly overrideKeys?: readonly string[];
}

/**
 * api の `varlock load` に渡す env。web の varlock が process.env へ注入した値と
 * graph（`__VARLOCK_ENV` など）は外す。残すと api は自分の schema / `.env.local` を
 * 読まずに web の解決結果を使ってしまう。シェルから明示した値（overrideKeys）は残す。
 */
const apiLoadEnv = (env: NodeJS.ProcessEnv): NodeJS.ProcessEnv => {
  const webGraph =
    env["__VARLOCK_ENV"] === undefined
      ? undefined
      : (JSON.parse(env["__VARLOCK_ENV"]) as VarlockFullGraph);
  const explicit = new Set(webGraph?.overrideKeys);
  const injected = new Set(
    Object.keys(webGraph?.config ?? {}).filter((key) => !explicit.has(key))
  );

  // worker-configuration.d.ts が ProcessEnv に web のキーを必須で足すため cast する。
  return Object.fromEntries(
    Object.entries(env).filter(
      ([key]) => !/^_{1,2}VARLOCK/u.test(key) && !injected.has(key)
    )
  ) as NodeJS.ProcessEnv;
};

/**
 * `vite dev` で pantry-api を auxiliary worker として同時に起動し、`env.API` の
 * Service Binding を本物の api に繋ぐ。varlock は web の env しか entry worker へ
 * 注入しないため、api の env は apps/api の schema で読み直して vars として渡す。
 * varlock の runtime は auxiliary worker にも入るので、`__VARLOCK_ENV`（graph）も渡す。
 */
const apiAuxiliaryWorker = () => {
  const serializedGraph = execSyncVarlock("load --format json-full --compact", {
    callerDir: apiRoot,
    cwd: apiRoot,
    env: apiLoadEnv(process.env),
  });
  const graph = JSON.parse(serializedGraph) as VarlockFullGraph;
  const vars: Record<string, string> = { __VARLOCK_ENV: serializedGraph };
  for (const [key, { value }] of Object.entries(graph.config)) {
    if (value !== undefined) {
      vars[key] = typeof value === "string" ? value : JSON.stringify(value);
    }
  }

  return {
    config: { vars },
    configPath: path.join(apiRoot, "wrangler.jsonc"),
  };
};

const config = defineConfig(({ command }) => ({
  plugins: [
    devtools(),
    varlockCloudflareVitePlugin({
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
