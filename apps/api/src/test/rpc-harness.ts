import { createClient } from "@libsql/client";
import type { Client } from "@libsql/client";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
import type { ContractRouterClient } from "@orpc/contract";
import type { ApiContract } from "@pantry/api-contract";
import type { SessionUser } from "@pantry/api-contract/schemas/session-user";
import type { AppDb } from "@pantry/db";
import { migrationsFolder } from "@pantry/db/migrations";
import { user as usersTable } from "@pantry/db/schema/auth-schema";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, beforeEach } from "vitest";

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
