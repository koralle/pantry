import { drizzle } from "drizzle-orm/libsql";

import type { AppDb } from "./app-db";
import type { TursoConnection } from "./turso-connection";

export const createDb = (connection: TursoConnection): AppDb =>
  // Drizzle-orm 1.0: SQLite drizzle() no longer accepts `schema` (use `relations` for RQBv2).
  drizzle({
    connection,
  });
