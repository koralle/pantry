import { createClient } from "@libsql/client";
import type { Client } from "@libsql/client";
import type { AppDb } from "@pantry/db";
import { user } from "@pantry/db/schema/auth-schema";
import { bookmarkTable } from "@pantry/db/schema/bookmark";
import { bookmarkTagsTable } from "@pantry/db/schema/bookmark-tag";
import { tagsTable } from "@pantry/db/schema/tag";
import { drizzle } from "drizzle-orm/libsql";
import * as v from "valibot";
import { afterAll, beforeAll, beforeEach, inject } from "vitest";

import { userIdSchema } from "../../domain/user-id";
import type { UserId } from "../../domain/user-id";

declare module "vitest" {
  export interface ProvidedContext {
    libsqlUrl: string;
  }
}

interface PersistenceDb {
  getDb: () => AppDb;
  getClient: () => Client;
}

interface SqliteObject {
  readonly name: string;
  readonly type: string;
}

const quoteIdentifier = (name: string): string =>
  `"${name.replaceAll('"', '""')}"`;

const namesOf = (
  objects: readonly SqliteObject[],
  type: "table" | "trigger"
): string[] =>
  objects.flatMap((object) => (object.type === type ? [object.name] : []));

/**
 * 本番 migration が作った schema をそのままに、テストごとにデータだけを空にする。
 * テストが作った trigger も落とすのは、前のテストの仕掛けが次のテストへ漏れないようにするため。
 */
async function resetPersistenceDatabase(client: Client): Promise<void> {
  const result = await client.execute(
    "SELECT type, name FROM sqlite_master WHERE type IN ('table', 'trigger') AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%'"
  );
  const objects: SqliteObject[] = result.rows.flatMap((row) => {
    const { name, type } = row;
    return typeof name === "string" && typeof type === "string"
      ? [{ name, type }]
      : [];
  });
  const statements = [
    "PRAGMA foreign_keys = OFF",
    ...namesOf(objects, "trigger").map(
      (name) => `DROP TRIGGER IF EXISTS ${quoteIdentifier(name)}`
    ),
    ...namesOf(objects, "table").map(
      (name) => `DELETE FROM ${quoteIdentifier(name)}`
    ),
    "PRAGMA foreign_keys = ON",
  ];
  await client.executeMultiple(statements.join(";\n"));
}

export function withPersistenceDb(): PersistenceDb {
  let client: Client | undefined;
  let db: AppDb | undefined;

  beforeAll(() => {
    client = createClient({ url: inject("libsqlUrl") });
    db = drizzle({ client });
  });

  afterAll(() => {
    client?.close();
    client = undefined;
    db = undefined;
  });

  beforeEach(async () => {
    if (client === undefined) {
      throw new Error("persistence client is not initialized");
    }
    await resetPersistenceDatabase(client);
  });

  return {
    getClient: () => {
      if (client === undefined) {
        throw new Error("persistence client is not initialized");
      }
      return client;
    },
    getDb: () => {
      if (db === undefined) {
        throw new Error("persistence db is not initialized");
      }
      return db;
    },
  };
}

export function parseUserId(value: string): UserId {
  return v.parse(userIdSchema, value);
}

export async function seedUser(db: AppDb, id: string): Promise<UserId> {
  await db.insert(user).values({
    email: `${id}@example.com`,
    id,
    name: id,
  });
  return parseUserId(id);
}

export async function seedTag(
  db: AppDb,
  input: {
    readonly userId: string;
    readonly name: string;
    readonly pinned?: boolean;
    readonly sortOrder?: number;
    readonly color?: string | null;
    readonly lastUsedAt?: Date | null;
  }
): Promise<number> {
  const inserted = await db
    .insert(tagsTable)
    .values({
      color: input.color ?? null,
      lastUsedAt: input.lastUsedAt ?? null,
      name: input.name,
      normalizedName: input.name.toLowerCase(),
      pinned: input.pinned ?? false,
      sortOrder: input.sortOrder ?? 0,
      userId: input.userId,
    })
    .returning({ id: tagsTable.id });
  const [row] = inserted;
  if (row === undefined) {
    throw new Error("seedTag failed to return the inserted row");
  }
  return row.id;
}

export async function seedBookmark(
  db: AppDb,
  input: {
    readonly id: string;
    readonly userId: string;
    readonly title?: string;
    readonly url?: string;
    readonly note?: string | null;
    readonly favorite?: boolean;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
    readonly deletedAt?: Date | null;
    readonly tagIds?: readonly number[];
  }
): Promise<void> {
  await db.insert(bookmarkTable).values({
    favorite: input.favorite ?? false,
    id: input.id,
    note: input.note ?? null,
    title: input.title ?? input.id,
    url: input.url ?? `https://example.com/${input.id}`,
    userId: input.userId,
    ...(input.createdAt === undefined ? {} : { createdAt: input.createdAt }),
    ...(input.updatedAt === undefined ? {} : { updatedAt: input.updatedAt }),
    ...(input.deletedAt === undefined ? {} : { deletedAt: input.deletedAt }),
  });
  if (input.tagIds !== undefined && input.tagIds.length > 0) {
    await db.insert(bookmarkTagsTable).values(
      input.tagIds.map((tagId) => ({
        bookmarkId: input.id,
        tagId,
      }))
    );
  }
}

export async function attachTag(
  db: AppDb,
  id: string,
  tagId: number
): Promise<void> {
  await db.insert(bookmarkTagsTable).values({ bookmarkId: id, tagId });
}

export async function seedBookmarks(
  db: AppDb,
  rows: readonly Parameters<typeof seedBookmark>[1][]
): Promise<void> {
  if (rows.length === 0) {
    return;
  }
  await db.insert(bookmarkTable).values(
    rows.map((input) => ({
      favorite: input.favorite ?? false,
      id: input.id,
      note: input.note ?? null,
      title: input.title ?? input.id,
      url: input.url ?? `https://example.com/${input.id}`,
      userId: input.userId,
      ...(input.createdAt === undefined ? {} : { createdAt: input.createdAt }),
      ...(input.updatedAt === undefined ? {} : { updatedAt: input.updatedAt }),
      ...(input.deletedAt === undefined ? {} : { deletedAt: input.deletedAt }),
    }))
  );
  const tagRows = rows.flatMap((input) =>
    (input.tagIds ?? []).map((tagId) => ({
      bookmarkId: input.id,
      tagId,
    }))
  );
  if (tagRows.length > 0) {
    await db.insert(bookmarkTagsTable).values(tagRows);
  }
}

export function bookmarkId(index: number): string {
  return `019fae92-3bb0-78cd-b488-${index.toString(16).padStart(12, "0")}`;
}
