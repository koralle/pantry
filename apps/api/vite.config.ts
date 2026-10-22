import { cloudflare } from "@cloudflare/vite-plugin";
import { workerVars } from "@pantry/env";
import { defineConfig } from "vite";

/**
 * apps/web と違い TanStack Start / React は載せない。`@cloudflare/vite-plugin` が
 * worker の entry（wrangler.jsonc の `main`）を組む。
 *
 * dev では packages/env の値を vars として渡す（本番の vars / secrets は
 * `wrangler deploy` が設定する）。build は値を焼き込まない。
 */
const config = defineConfig(({ command }) => ({
  plugins: [
    cloudflare(command === "serve" ? { config: { vars: workerVars() } } : {}),
  ],
}));

export default config;
