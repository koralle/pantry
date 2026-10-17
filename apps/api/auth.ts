import { createDb } from "@pantry/db";
import * as v from "valibot";

import { createAuth } from "./src/auth/create-auth";

/**
 * Better Auth CLI（`auth generate --config ../../apps/api/auth.ts`）と
 * 今後の Node スクリプト用の entry。
 *
 * Worker runtime は `cloudflare:workers` の binding を読むため、このファイルは
 * bundler から参照されない。process.env を valibot で検証してから接続を作る。
 */
const env = v.parse(
  v.object({
    BETTER_AUTH_SECRET: v.pipe(v.string(), v.minLength(32)),
    BETTER_AUTH_URL: v.pipe(v.string(), v.url()),
    TURSO_AUTH_TOKEN: v.string(),
    TURSO_CONNECTION_URL: v.string(),
  }),
  process.env
);

export const db = createDb({
  authToken: env.TURSO_AUTH_TOKEN,
  url: env.TURSO_CONNECTION_URL,
});

export const auth = createAuth({
  baseURL: env.BETTER_AUTH_URL,
  db,
  secret: env.BETTER_AUTH_SECRET,
});
