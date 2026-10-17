import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import type { AppDb } from "@pantry/db";
import * as authSchema from "@pantry/db/schema/auth-schema";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";

import { passkeyPluginOptions } from "./passkey-plugin-options";

export interface CreateAuthOptions {
  readonly baseURL: string;
  readonly db: AppDb;
  readonly secret: string;
}

/**
 * Pantry の正本となる Better Auth 構成。
 *
 * テーブル定義は `packages/db/src/schema/auth-schema.ts` が持つ。drizzle adapter は
 * model 名（`user` / `session` など）で schema を引くため、同名の export を持つ
 * auth-schema をそのまま渡せば複数形のテーブル（`users` / `sessions` など）へ写る。
 */
/**
 * クライアント IP を読むヘッダー。Cloudflare の edge は CF-Connecting-IP を必ず
 * 上書きするので偽装できない。X-Forwarded-For はクライアントが付けた値に edge が
 * 追記するため複数値になりやすく、Better Auth は複数値を信用しない（IP 不明として
 * rate limit が共有バケットに落ちる）。CF 以外（ローカルのテストなど）の予備として残す。
 * web は Service Binding へ元の Request をそのまま渡すので、どちらも変わらずに届く。
 */
export const CLIENT_IP_HEADERS = ["cf-connecting-ip", "x-forwarded-for"];

export const createAuth = ({ baseURL, db, secret }: CreateAuthOptions) =>
  betterAuth({
    advanced: {
      ipAddress: {
        ipAddressHeaders: CLIENT_IP_HEADERS,
      },
    },
    baseURL,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        ...authSchema,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [admin(), passkey(passkeyPluginOptions(baseURL))],
    secret,
    session: {
      freshAge: 0,
    },
  });

export type Auth = ReturnType<typeof createAuth>;
