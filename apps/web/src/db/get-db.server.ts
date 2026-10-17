import type { AppDb } from "@pantry/db";
import { createDb, resolveTursoConnection } from "@pantry/db";
import { createServerOnlyFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

let cachedDb: AppDb | undefined;

export const getDB = createServerOnlyFn((): AppDb => {
  cachedDb ??= createDb(resolveTursoConnection(env));
  return cachedDb;
});
