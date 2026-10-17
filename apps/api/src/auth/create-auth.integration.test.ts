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
import { eq } from "drizzle-orm";
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
    authenticate: async (headers, responseHeaders) =>
      await authenticateRequest(
        [cookieSessionAuthenticator(auth)],
        headers,
        responseHeaders
      ),
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

/** Better Auth の HTTP ルートでサインインし、Cookie ヘッダーに載せる値を返す。 */
const signIn = async (app: App, email: string): Promise<string> => {
  const response = await app.request(`${baseURL}/api/auth/sign-in/email`, {
    body: JSON.stringify({ email, password }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  expect(response.status).toBe(200);
  return createSessionCookie(response);
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

    // adapter が packages/db の複数形テーブルへ書き込んでいることを、実際のテーブルで確かめる。
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

  it("admin が banUser したユーザーは、既存の Cookie でも me が 401 になる", async () => {
    const app = createTestApp();
    const { user: target } = await auth.api.signUpEmail({
      body: { email: "banned@example.com", name: "banned", password },
    });
    const { user: admin } = await auth.api.signUpEmail({
      body: { email: "admin@example.com", name: "admin", password },
    });
    await db
      .update(usersTable)
      .set({ role: "admin" })
      .where(eq(usersTable.id, admin.id));

    const targetCookie = await signIn(app, "banned@example.com");
    const adminCookie = await signIn(app, "admin@example.com");

    await expect(
      createRpcClient(app, targetCookie).me()
    ).resolves.toMatchObject({ id: target.id });

    await auth.api.banUser({
      body: { userId: target.id },
      headers: new Headers({ cookie: adminCookie }),
    });

    await expect(createRpcClient(app, targetCookie).me()).rejects.toMatchObject(
      { code: "UNAUTHORIZED", status: 401 }
    );
    // ban は対象の session だけを失効させ、admin の session は残る。
    await expect(createRpcClient(app, adminCookie).me()).resolves.toMatchObject(
      { id: admin.id }
    );
  });

  it("サインイン時のクライアント IP は CF-Connecting-IP から記録する", async () => {
    const app = createTestApp();
    const { user } = await auth.api.signUpEmail({
      body: { email: "ip@example.com", name: "ip", password },
    });

    const response = await app.request(`${baseURL}/api/auth/sign-in/email`, {
      body: JSON.stringify({ email: "ip@example.com", password }),
      headers: {
        "cf-connecting-ip": "203.0.113.7",
        "content-type": "application/json",
        // クライアントが付けた値に edge が追記した形。Better Auth は複数値を信用しない。
        "x-forwarded-for": "198.51.100.1, 203.0.113.7",
      },
      method: "POST",
    });
    expect(response.status).toBe(200);

    // rate limit も同じ getIp でキーを作るため、session の ipAddress で解決結果を確かめる。
    const sessions = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, user.id));
    // signUpEmail（HTTP を通さない呼び出し）が作った session は IP を持たない。
    expect(
      sessions.map((session) => session.ipAddress).filter(Boolean)
    ).toStrictEqual(["203.0.113.7"]);
  });

  it("CF-Connecting-IP が無ければ単一値の X-Forwarded-For を使う", async () => {
    const app = createTestApp();
    const { user } = await auth.api.signUpEmail({
      body: { email: "xff@example.com", name: "xff", password },
    });

    const response = await app.request(`${baseURL}/api/auth/sign-in/email`, {
      body: JSON.stringify({ email: "xff@example.com", password }),
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "198.51.100.23",
      },
      method: "POST",
    });
    expect(response.status).toBe(200);

    const sessions = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, user.id));
    // signUpEmail（HTTP を通さない呼び出し）が作った session は IP を持たない。
    expect(
      sessions.map((session) => session.ipAddress).filter(Boolean)
    ).toStrictEqual(["198.51.100.23"]);
  });

  it("me で session が延長されたら Set-Cookie をレスポンスへ載せる", async () => {
    const app = createTestApp();
    const { user } = await auth.api.signUpEmail({
      body: { email: "refresh@example.com", name: "refresh", password },
    });
    const cookie = await signIn(app, "refresh@example.com");

    const responses: Response[] = [];
    const client = createORPCClient<Client>(
      new RPCLink({
        fetch: async (request) => {
          const headers = new Headers(request.headers);
          headers.set("cookie", cookie);
          const response = await app.fetch(new Request(request, { headers }));
          responses.push(response.clone());
          return response;
        },
        url: `${baseURL}/rpc`,
      })
    );

    // 延長が要らない新しい session では Set-Cookie を返さない。
    await expect(client.me()).resolves.toMatchObject({ id: user.id });
    expect(responses.at(-1)?.headers.getSetCookie()).toStrictEqual([]);

    // updateAge（既定 1 日）を過ぎた session にする。
    const nearExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await db
      .update(sessionsTable)
      .set({ expiresAt: nearExpiry })
      .where(eq(sessionsTable.userId, user.id));

    await expect(client.me()).resolves.toMatchObject({ id: user.id });

    const setCookies = responses.at(-1)?.headers.getSetCookie() ?? [];
    expect(
      setCookies.some((value) => value.startsWith("better-auth.session_token="))
    ).toBe(true);
    // Cookie の session（サインインで作ったもの）だけが延長される。
    const sessions = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, user.id));
    expect(
      Math.max(...sessions.map((session) => session.expiresAt.getTime()))
    ).toBeGreaterThan(nearExpiry.getTime());
  });

  it("Cookie セッションが無ければ me は 401 を返す", async () => {
    const app = createTestApp();

    await expect(createRpcClient(app).me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
  });
});
