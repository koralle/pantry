import { varlockCloudflareVitePlugin } from "@varlock/cloudflare-integration";
import { defineConfig } from "vite";

/**
 * apps/web と違い TanStack Start / React は載せない。varlock が env を検証し、
 * `@cloudflare/vite-plugin` が worker の entry（wrangler.jsonc の `main`）を組む。
 */
const config = defineConfig({
  plugins: [varlockCloudflareVitePlugin()],
});

export default config;
