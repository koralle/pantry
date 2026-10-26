import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import type { AppDb } from "@pantry/db";
import * as authSchema from "@pantry/db/schema/auth-schema";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";

import { passkeyPluginOptions } from "./passkey-plugin-options";

export interface CreateAuthOptions {
  /** `APP_ENV`（development / test / production）。本番だけ信用するヘッダーを絞る。 */
  readonly appEnv: string;
  readonly baseURL: string;
  readonly db: AppDb;
  readonly secret: string;
}

/**
 * クライアント IP を読むヘッダー（rate limit のキーと session の ipAddress）。
 *
 * 既定は Cloudflare の edge が必ず上書きする CF-Connecting-IP だけを信用する。
 * X-Forwarded-For はクライアントが自由に付けられるので、本番で読むと IP を偽装して
 * rate limit を回避できてしまう。CF の edge を通らない開発・テストでだけ予備として読む。
 * 許可リストにしてあるので、APP_ENV が未設定・typo・未知の値でも X-Forwarded-For は読まない。
 * web は Service Binding へ元の Request をそのまま渡すので、どちらも変わらずに届く。
 */
const ENVS_TRUSTING_FORWARDED_FOR: ReadonlySet<string> = new Set([
  "development",
  "test",
]);

export const clientIpHeaders = (appEnv: string | undefined): string[] =>
  appEnv !== undefined && ENVS_TRUSTING_FORWARDED_FOR.has(appEnv)
    ? ["cf-connecting-ip", "x-forwarded-for"]
    : ["cf-connecting-ip"];

/**
 * Pantry の正本となる Better Auth 構成。
 *
 * テーブル定義は `packages/db/src/schema/auth-schema.ts` が持つ。drizzle adapter は
 * model 名（`user` / `session` など）で schema を引くため、同名の export を持つ
 * auth-schema をそのまま渡せば複数形のテーブル（`users` / `sessions` など）へ写る。
 */
export const createAuth = ({
  appEnv,
  baseURL,
  db,
  secret,
}: CreateAuthOptions) =>
  betterAuth({
    advanced: {
      ipAddress: {
        ipAddressHeaders: clientIpHeaders(appEnv),
      },
    },
    baseURL,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        ...authSchema,
      },
    }),
    // アカウントは運用者が `apps/api/scripts/create-user.ts` で作る。自己登録は受け付けず、
    // サインインだけを開ける（docs/architecture.md の「サインアップ画面を提供せず、
    // Better Auth の自己登録エンドポイントも無効にする」）。
    emailAndPassword: {
      disableSignUp: true,
      enabled: true,
    },
    plugins: [admin(), passkey(passkeyPluginOptions(baseURL))],
    secret,
    session: {
      freshAge: 0,
    },
  });

export type Auth = ReturnType<typeof createAuth>;
