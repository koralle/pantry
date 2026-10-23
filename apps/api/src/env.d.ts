/**
 * Runtime env of the api Worker. 値は dev では packages/env から
 * `vite.config.ts` の `workerVars()` が vars として渡し、本番では CI が
 * wrangler-action（`secrets` / `vars`）で設定する。wrangler.jsonc に
 * `vars` を置かないため `wrangler types` の生成物には現れず、ここで宣言する。
 */
declare namespace Cloudflare {
  interface Env {
    APP_ENV: string;
    TURSO_CONNECTION_URL: string;
    TURSO_AUTH_TOKEN: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
  }
}
