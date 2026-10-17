import { createAuth } from "@pantry/api/auth";
import { createDb, resolveTursoConnection } from "@pantry/db";

/**
 * 開発用スクリプト（seed / create-user）が使う Node 側の Better Auth。
 * 構成の正本は `apps/api`（`createAuth`）で、web は Worker に Better Auth を持たない。
 * env は `varlock run --path ../api/` で `apps/api` の schema から読む。
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
