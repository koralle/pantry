import { createClient } from "@libsql/client";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { contract } from "@pantry/api-contract";
import type { AppDb } from "@pantry/db";
import { migrationsFolder } from "@pantry/db/migrations";
import {
  session as sessionsTable,
  user as usersTable,
} from "@pantry/db/schema/auth-schema";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "../app";
import type { Auth } from "./create-auth";
import { createAuth } from "./create-auth";
import { authenticateRequest, cookieSessionAuthenticator } from "./session";

/**
 * Libsql の `:memory:` は transaction のたびに接続を張り直すため、shared cache 付きの
 * `file::memory:` で全接続から同じ DB を見る（apps/web のテストと同じ手法）。
 */
const memoryUrl = "file::memory:?cache=shared";
const baseURL = "http://localhost:3000";
const secret = "test-secret-at-least-32-characters-long";
const password = "password-1234";

type App = ReturnType<typeof createApp>;
type Client = ContractRouterClient<typeof contract>;

let libsqlClient: ReturnType<typeof createClient>;
let db: AppDb;
let auth: Auth;

const createRpcClient = (app: App, cookie?: string): Client => {
  const link = new RPCLink({
    fetch: async (request) => {
      if (cookie === undefined) {
        return await app.fetch(request);
      }

      const headers = new Headers(request.headers);
      headers.set("cookie", cookie);

      return await app.fetch(new Request(request, { headers }));
    },
    url: `${baseURL}/rpc`,
  });

  return createORPCClient<Client>(link);
};

const createTestApp = (): App =>
  createApp({
    authenticate: async (headers) =>
      await authenticateRequest([cookieSessionAuthenticator(auth)], headers),
    handleAuthRequest: auth.handler,
  });

const createSessionCookie = (response: Response): string => {
  const setCookie = response.headers.get("set-cookie");
  if (setCookie === null) {
    throw new Error("session cookie was not set");
  }

  const [pair] = setCookie.split(";");
  if (pair === undefined || pair.length === 0) {
    throw new Error("session cookie was not set");
  }

  return pair;
};

beforeAll(async () => {
  libsqlClient = createClient({ url: memoryUrl });
  db = drizzle({ client: libsqlClient });
  await migrate(db, { migrationsFolder });

  auth = createAuth({ baseURL, db, secret });
});

afterAll(() => {
  libsqlClient.close();
});

describe("createAuth", () => {
  it("メール・パスワードのサインインを Better Auth の HTTP ルートで受ける", async () => {
    const signUpResponse = await auth.api.signUpEmail({
      asResponse: true,
      body: {
        email: "koralle@example.com",
        name: "koralle",
        password,
      },
    });

    expect(signUpResponse.status).toBe(200);

    // better-auth の modelName が複数形になっている証拠として、実際のテーブルを読む。
    await expect(db.select().from(usersTable)).resolves.toMatchObject([
      { email: "koralle@example.com", name: "koralle" },
    ]);
    await expect(db.select().from(sessionsTable)).resolves.toHaveLength(1);

    const app = createTestApp();

    const signInResponse = await app.request(
      `${baseURL}/api/auth/sign-in/email`,
      {
        body: JSON.stringify({
          email: "koralle@example.com",
          password,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      }
    );

    expect(signInResponse.status).toBe(200);

    const cookie = createSessionCookie(signInResponse);

    await expect(createRpcClient(app, cookie).me()).resolves.toStrictEqual({
      email: "koralle@example.com",
      id: expect.any(String),
      name: "koralle",
    });
  });

  it("Cookie セッションが無ければ me は 401 を返す", async () => {
    const app = createTestApp();

    await expect(createRpcClient(app).me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
  });
});
