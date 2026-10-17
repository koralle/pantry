import { fileURLToPath } from "node:url";

/**
 * `drizzle/` の絶対パス。Node からしか使わない（Worker には載せない）。
 */
export const migrationsFolder = fileURLToPath(
  new URL("../drizzle", import.meta.url)
);
