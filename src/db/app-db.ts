import type { LibSQLDatabase } from 'drizzle-orm/libsql'

/**
 * Application 層へ注入する DB ハンドル。
 * `getDB()` の戻り値と同じ形で、Router / セッション API には依存しない。
 */
export type AppDb = LibSQLDatabase
