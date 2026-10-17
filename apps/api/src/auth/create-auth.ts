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
export const createAuth = ({ baseURL, db, secret }: CreateAuthOptions) =>
  betterAuth({
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
