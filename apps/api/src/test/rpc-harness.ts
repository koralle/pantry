import { createClient } from "@libsql/client";
import type { Client } from "@libsql/client";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
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
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";

import { createApp } from "../app";

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

/** 本番と同じ条件で確かめるため、既定で `x-csrf-token` を付ける。 */
export const createTestClient = (
  db: AppDb,
  as: SessionUser | null,
  { csrf = true }: { readonly csrf?: boolean } = {}
): ApiTestClient => {
  const app = createApp({
    authenticate: async () => as,
    db: () => db,
    handleAuthRequest: unusedAuthHandler,
    reportError: () => {
      // テストは失敗を client 側の 500 で確かめるので、ログに出さない。
    },
  });

  return createORPCClient<ApiTestClient>(
    new RPCLink({
      fetch: async (request) => await app.fetch(request),
      plugins: csrf ? [new SimpleCsrfProtectionLinkPlugin()] : [],
      url: "http://api.test/rpc",
    })
  );
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
    `x-csrf-token の無い ${namespace}.%s は認証済みでも 403 で拒否する（CSRF の除外は health / me だけ）`,
    async (name) => {
      const call = callEveryProcedure(
        createTestClient(getDb(), actor, { csrf: false })
      )[name];
      await expect(call()).rejects.toMatchObject({
        code: "CSRF_TOKEN_MISMATCH",
        status: 403,
      });
    }
  );
};
