import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import type { AppDb } from "@pantry/db";
import {
  account,
  passkey as passkeyTable,
  session,
  user,
  verification,
} from "@pantry/db/schema/auth-schema";
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
 * packages/db のテーブル名（複数形）に合わせて `modelName` を明示する。
 * drizzle adapter は schema を model 名で引くため、渡す schema のキーも複数形にする。
 * これで better-auth CLI が生成するテーブル名と
 * `packages/db/src/schema/auth-schema.ts` が一致する。
 */
export const createAuth = ({ baseURL, db, secret }: CreateAuthOptions) =>
  betterAuth({
    account: {
      modelName: "accounts",
    },
    baseURL,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        accounts: account,
        passkeys: passkeyTable,
        sessions: session,
        users: user,
        verifications: verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      admin(),
      passkey({
        ...passkeyPluginOptions(baseURL),
        schema: {
          passkey: {
            modelName: "passkeys",
          },
        },
      }),
    ],
    secret,
    session: {
      freshAge: 0,
      modelName: "sessions",
    },
    user: {
      modelName: "users",
    },
    verification: {
      modelName: "verifications",
    },
  });

export type Auth = ReturnType<typeof createAuth>;
