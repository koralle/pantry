import type { AppDb } from "@pantry/db";
import { createDb, resolveTursoConnection } from "@pantry/db";
import { env } from "cloudflare:workers";

import { createApp } from "./app";
import type { Auth } from "./auth/create-auth";
import { createAuth } from "./auth/create-auth";
import {
  authenticateRequest,
  cookieSessionAuthenticator,
} from "./auth/session";

let cachedDb: AppDb | undefined;
let cachedAuth: Auth | undefined;

const getDb = (): AppDb => {
  cachedDb ??= createDb(resolveTursoConnection(env));
  return cachedDb;
};

/** isolate ごとに 1 度だけ Better Auth を組み立てる。 */
const getAuth = (): Auth => {
  cachedAuth ??= createAuth({
    appEnv: env.APP_ENV,
    baseURL: env.BETTER_AUTH_URL,
    db: getDb(),
    secret: env.BETTER_AUTH_SECRET,
  });
  return cachedAuth;
};

/**
 * 本番の配線。DB と auth は isolate 単位で遅延生成する。
 *
 * `createApp` 自体は env を読まないため、module の import 時に binding は要らない
 * （テストからも安全に import できる）。将来 Bearer / OAuth の authenticator を
 * 足すときは、この配列へ追加する。
 */
export default createApp({
  authenticate: async (headers, responseHeaders) =>
    await authenticateRequest(
      [cookieSessionAuthenticator(getAuth())],
      headers,
      responseHeaders
    ),
  handleAuthRequest: async (request) => await getAuth().handler(request),
});
