import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import { createServerOnlyFn } from "@tanstack/react-start";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { env } from "cloudflare:workers";

import { getDB } from "../../../db/get-db.server";
import * as schema from "../../../db/schema/auth-schema";
import { passkeyPluginOptions } from "../lib/passkey/plugin-options";

type Auth = ReturnType<typeof createAuth>;

const createAuth = () =>
  betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(getDB(), {
      provider: "sqlite",
      schema: {
        ...schema,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [admin(), passkey(passkeyPluginOptions(env.BETTER_AUTH_URL))],
    secret: env.BETTER_AUTH_SECRET,
    session: {
      freshAge: 0,
    },
  });

let cachedAuth: Auth | undefined;

export const getAuth = createServerOnlyFn(() => {
  cachedAuth ??= createAuth();
  return cachedAuth;
});
