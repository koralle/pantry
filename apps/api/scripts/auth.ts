import { createDb, resolveTursoConnection } from "@pantry/db";

import { createAuth } from "../src/auth/create-auth";

/**
 * 開発用スクリプト（seed / create-user）が使う Node 側の Better Auth。
 * Worker と同じ `createAuth` を使い、env は `varlock run --path scripts/`
 * （scripts 専用の `apps/api/scripts/.env.schema`）から読む。
 */
const requireEnv = (key: "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL"): string => {
  const value = process.env[key];
  if (value === undefined || value.length === 0) {
    throw new Error(`${key} is not defined`);
  }
  return value;
};

export const db = createDb(resolveTursoConnection(process.env));

export const auth = createAuth({
  baseURL: requireEnv("BETTER_AUTH_URL"),
  db,
  secret: requireEnv("BETTER_AUTH_SECRET"),
});
