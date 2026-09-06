import { createServerOnlyFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/libsql";

import type { AppDb } from "./app-db";
import { resolveTursoConnection } from "./turso-connection";

const createDb = (connection: { url: string; authToken: string }): AppDb =>
  // Drizzle-orm 1.0: SQLite drizzle() no longer accepts `schema` (use `relations` for RQBv2).
  drizzle({
    connection,
  });

let cachedDb: AppDb | undefined;

export const getDB = createServerOnlyFn((): AppDb => {
  cachedDb ??= createDb(resolveTursoConnection(env));
  return cachedDb;
});
