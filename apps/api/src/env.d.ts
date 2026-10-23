/**
 * `APP_ENV` だけをここで宣言する。dev では packages/env から `vite.config.ts` の
 * `workerVars()` が vars として渡し、本番では CI が wrangler-action の `vars` で
 * 設定する。`wrangler.jsonc` に `vars` を置かないため `wrangler types` の生成物には
 * 現れない。secrets の4つは `wrangler.jsonc` の `secrets.required` から生成物に出る。
 */
declare namespace Cloudflare {
  interface Env {
    APP_ENV: string;
  }
}
