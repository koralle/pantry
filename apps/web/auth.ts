import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import { createDb } from "@pantry/db";
import * as schema from "@pantry/db/schema/auth-schema";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";

import { env } from "./env";
import { passkeyPluginOptions } from "./src/features/auth/lib/passkey/plugin-options";

export const db = createDb({
  authToken: env.TURSO_AUTH_TOKEN,
  url: env.TURSO_CONNECTION_URL,
});

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
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
