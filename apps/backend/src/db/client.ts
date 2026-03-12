import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type AppDb = DrizzleD1Database<typeof schema>;

export const createDb = (database: D1Database): AppDb =>
  drizzle(database, {
    schema,
  });
