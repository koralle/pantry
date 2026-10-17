import path from "node:path";

/**
 * `drizzle/` の絶対パス。Node からしか使わない（Worker には載せない）。
 *
 * Worker 向け tsconfig では global の `URL` が workerd の型になり、node:url の
 * `URL` と構造的に一致しない。`URL` オブジェクトを使わず `import.meta.dirname`
 * から解決する。
 */
export const migrationsFolder = path.join(import.meta.dirname, "..", "drizzle");
