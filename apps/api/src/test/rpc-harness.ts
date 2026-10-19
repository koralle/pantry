import { createClient } from "@libsql/client";
import type { Client } from "@libsql/client";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { isContractProcedure } from "@orpc/contract";
import type {
  AnyContractProcedure,
  ContractRouterClient,
} from "@orpc/contract";
import type { ApiContract } from "@pantry/api-contract";
import type { SessionUser } from "@pantry/api-contract/schemas/session-user";
import type { AppDb } from "@pantry/db";
import { migrationsFolder } from "@pantry/db/migrations";
import { user as usersTable } from "@pantry/db/schema/auth-schema";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";

import { createApp } from "../app";
import type { Authenticator } from "../auth/session";

export const actor: SessionUser = {
  email: "actor@example.com",
  id: "user-actor",
  name: "actor",
};

export const other: SessionUser = {
  email: "other@example.com",
  id: "user-other",
  name: "other",
};

export type ApiTestClient = ContractRouterClient<ApiContract>;

/**
 * Libsql の `:memory:` は transaction のたびに接続を張り直して別の DB になるため shared cache にする。
 * test file ごとに別 process なので混ざらない。
 */
const memoryUrl = "file::memory:?cache=shared";

const resetRows = async (client: Client): Promise<void> => {
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%'"
  );
  const names = tables.rows.flatMap((row) =>
    typeof row["name"] === "string" ? [row["name"]] : []
  );
  await client.executeMultiple(
    [
      "PRAGMA foreign_keys = OFF",
      ...names.map((name) => `DELETE FROM "${name.replaceAll('"', '""')}"`),
      "PRAGMA foreign_keys = ON",
    ].join(";\n")
  );
};

export const withMigratedDb = (): { readonly getDb: () => AppDb } => {
  let client: Client | undefined;
  let db: AppDb | undefined;

  beforeAll(async () => {
    client = createClient({ url: memoryUrl });
    db = drizzle({ client });
    await migrate(db, { migrationsFolder });
  });

  afterAll(() => {
    client?.close();
  });

  beforeEach(async () => {
    if (client === undefined || db === undefined) {
      throw new Error("test db is not initialized");
    }
    await resetRows(client);
    await db.insert(usersTable).values([actor, other]);
  });

  return {
    getDb: () => {
      if (db === undefined) {
        throw new Error("test db is not initialized");
      }
      return db;
    },
  };
};

const unusedAuthHandler = async (): Promise<Response> =>
  new Response("unused", { status: 500 });

/** api の URL と別にするのは、本番でも Origin を request の URL ではなく設定から決めるため。 */
export const testTrustedOrigin = "http://pantry.test";

const testRpcUrl = "http://api.test/rpc";

export const createTestApp = (
  db: AppDb,
  authenticate: Authenticator
): ReturnType<typeof createApp> =>
  createApp({
    authenticate,
    db: () => db,
    handleAuthRequest: unusedAuthHandler,
    reportError: () => {
      // テストは失敗を client 側の 500 で確かめるので、ログに出さない。
    },
    trustedOrigin: () => testTrustedOrigin,
  });

/**
 * `x-csrf-token` も Origin も付けない JSON の client にするのは、SSR と旧 web の送り方で
 * 全 procedure が通ることを既定で確かめるため。
 */
export const createTestClient = (
  db: AppDb,
  as: SessionUser | null
): ApiTestClient => {
  const app = createTestApp(db, async () => as);

  return createORPCClient<ApiTestClient>(
    new RPCLink({
      fetch: async (request) => await app.fetch(request),
      url: testRpcUrl,
    })
  );
};

/**
 * 別サイトの `<form>` / `fetch(..., { mode: "no-cors" })` が付けられる content-type。
 * content-type 無しも含めるのは、RPCHandler がそれを JSON として読むため。
 */
export const formLikeContentTypes = [
  "application/x-www-form-urlencoded",
  "multipart/form-data; boundary=pantry",
  "text/plain",
  undefined,
] as const;

type FormLikeContentType = (typeof formLikeContentTypes)[number];

/** same-site を含めるのは、`*.workers.dev` の兄弟 Worker が same-site になるため。 */
export const crossSiteHeaderSets: readonly Readonly<Record<string, string>>[] =
  [
    { origin: "https://evil.example" },
    { "sec-fetch-site": "cross-site" },
    { origin: "https://evil.example", "sec-fetch-site": "cross-site" },
    { "sec-fetch-site": "same-site" },
    {
      origin: "https://sibling.mkhd7930.workers.dev",
      "sec-fetch-site": "same-site",
    },
  ];

/** body を bytes で渡すのは、文字列だと `fetch` が text/plain を自動で付けてしまうため。 */
export const rawRpcRequest = ({
  body,
  contentType,
  headers = {},
  path,
}: {
  readonly body: unknown;
  readonly contentType: FormLikeContentType;
  readonly headers?: Readonly<Record<string, string>>;
  readonly path: string;
}): Request => {
  const request = new Request(`${testRpcUrl}/${path}`, {
    body: new TextEncoder().encode(JSON.stringify({ json: body })),
    headers: {
      ...headers,
      ...(contentType === undefined ? {} : { "content-type": contentType }),
    },
    method: "POST",
  });
  expect(request.headers.get("content-type")).toBe(contentType ?? null);
  return request;
};

export type ProcedurePath<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends AnyContractProcedure
    ? `${Prefix}${K}`
    : ProcedurePath<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

const collectProcedurePaths = (router: object, prefix: string): string[] =>
  Object.entries(router).flatMap(([key, value]: [string, unknown]) =>
    isContractProcedure(value)
      ? [`${prefix}${key}`]
      : collectProcedurePaths(value as object, `${prefix}${key}.`)
  );

/** 手で並べた一覧だと、新しい procedure が 401 / CSRF の検査から漏れるため契約から取る。 */
export const contractProcedureNames = <T extends object>(
  router: T
): ProcedurePath<T>[] =>
  collectProcedurePaths(router, "").toSorted() as ProcedurePath<T>[];

/** 機能ごとに書くと、どれかの機能で 401 / CSRF の検査が抜けても気付けないため共通にする。 */
export const itRequiresAuthAndCsrf = <Name extends string>({
  callEveryProcedure,
  getDb,
  namespace,
  procedureNames,
}: {
  readonly callEveryProcedure: (
    client: ApiTestClient
  ) => Record<Name, () => Promise<unknown>>;
  readonly getDb: () => AppDb;
  readonly namespace: string;
  readonly procedureNames: readonly Name[];
}): void => {
  it("401 / CSRF の検査は契約の全 procedure を過不足なく呼ぶ", () => {
    expect(
      Object.keys(
        callEveryProcedure(createTestClient(getDb(), null))
      ).toSorted()
    ).toStrictEqual(procedureNames);
  });

  it.each(procedureNames)(
    `未認証の ${namespace}.%s は defined な UNAUTHORIZED（401）を返す`,
    async (name) => {
      const call = callEveryProcedure(createTestClient(getDb(), null))[name];
      await expect(call()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        defined: true,
        status: 401,
      });
    }
  );

  it.each(procedureNames)(
    `x-csrf-token を付けない（SSR / 旧 web の）${namespace}.%s は CSRF で 403 にならない`,
    async (name) => {
      const call = callEveryProcedure(createTestClient(getDb(), actor))[name];
      const outcome: unknown = await call().catch((error: unknown) => error);
      expect(outcome).not.toMatchObject({ status: 403 });
    }
  );

  it.each(
    procedureNames.flatMap((name) =>
      formLikeContentTypes.map((contentType) => ({
        contentType: contentType ?? "（なし）",
        name,
        request: (headers: Readonly<Record<string, string>>) =>
          rawRpcRequest({
            body: {},
            contentType,
            headers,
            path: `${namespace}/${name.replaceAll(".", "/")}`,
          }),
      }))
    )
  )(
    `別サイトから content-type $contentType で送られた ${namespace}.$name は認証済みでも procedure に届かず 403`,
    async ({ request }) => {
      const authenticate = vi.fn<Authenticator>(async () => actor);
      const app = createTestApp(getDb(), authenticate);

      for (const headers of crossSiteHeaderSets) {
        const response = await app.fetch(request(headers));
        expect(response.status, JSON.stringify(headers)).toBe(403);
      }
      expect(authenticate).not.toHaveBeenCalled();
    }
  );
};
