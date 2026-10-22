import { createDb, resolveTursoConnection } from "@pantry/db";
import { loadDevEnv } from "@pantry/env";

import { createAuth } from "../src/auth/create-auth";

/**
 * 開発用スクリプト（seed / create-user）が使う Node 側の Better Auth。
 * Worker と同じ `createAuth` を使い、env は `@pantry/env` の値ファイル
 * （packages/env/.env.development）から読む。シェルで export した値が優先。
 */
loadDevEnv();

const requireEnv = (key: "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL"): string => {
  const value = process.env[key];
  if (value === undefined || value.length === 0) {
    throw new Error(`${key} is not defined`);
  }
  return value;
};

export const db = createDb(resolveTursoConnection(process.env));

export const auth = createAuth({
  appEnv: process.env["APP_ENV"] ?? "development",
  baseURL: requireEnv("BETTER_AUTH_URL"),
  db,
  secret: requireEnv("BETTER_AUTH_SECRET"),
});
