import { createClient } from "@libsql/client";
import type { Client } from "@libsql/client";
import {
  tagIdSchema,
  tagNameSchema,
} from "@pantry/api-contract/schemas/tag-values";
import type { AppDb } from "@pantry/db";
import { user } from "@pantry/db/schema/auth-schema";
import { bookmarkTable } from "@pantry/db/schema/bookmark";
import { bookmarkTagsTable } from "@pantry/db/schema/bookmark-tag";
import { tagsTable } from "@pantry/db/schema/tag";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { uuidv7 } from "uuidv7";
import * as v from "valibot";
import { afterAll, beforeAll, beforeEach, inject } from "vitest";

import { userIdSchema } from "../../domain/user-id";
import type { UserId } from "../../domain/user-id";

declare module "vitest" {
  export interface ProvidedContext {
    libsqlUrl: string;
  }
}

interface TestDb {
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
async function resetTestDatabase(client: Client): Promise<void> {
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

export function withTestDb(): TestDb {
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
      throw new Error("test db is not initialized");
    }
    await resetTestDatabase(client);
  });

  return {
    getClient: () => {
      if (client === undefined) {
        throw new Error("test db is not initialized");
      }
      return client;
    },
    getDb: () => {
      if (db === undefined) {
        throw new Error("test db is not initialized");
      }
      return db;
    },
  };
}

export function parseUserId(value: string): UserId {
  return v.parse(userIdSchema, value);
}

export function parseTagId(value: number) {
  return v.parse(tagIdSchema, value);
}

export function parseTagName(value: string) {
  return v.parse(tagNameSchema, value);
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
    readonly id?: string;
    readonly userId: string;
    readonly title?: string;
    readonly url?: string;
    readonly note?: string | null;
    readonly favorite?: boolean;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
    readonly deleted?: boolean;
    readonly deletedAt?: Date | null;
    readonly tagIds?: readonly number[];
  }
): Promise<string> {
  const id = input.id ?? uuidv7();
  const createdAt = input.createdAt ?? new Date();
  const deletedAt =
    input.deletedAt ?? (input.deleted === true ? new Date() : null);
  await db.insert(bookmarkTable).values({
    createdAt,
    deletedAt,
    favorite: input.favorite ?? false,
    id,
    note: input.note ?? null,
    title: input.title ?? id,
    updatedAt: input.updatedAt ?? createdAt,
    url: input.url ?? `https://example.com/${id}`,
    userId: input.userId,
  });
  if (input.tagIds !== undefined && input.tagIds.length > 0) {
    await db.insert(bookmarkTagsTable).values(
      input.tagIds.map((tagId) => ({
        bookmarkId: id,
        tagId,
      }))
    );
  }
  return id;
}

export async function selectBookmarkRow(db: AppDb, id: string) {
  const [row] = await db
    .select()
    .from(bookmarkTable)
    .where(eq(bookmarkTable.id, id));
  return row;
}

export async function attachTag(
  db: AppDb,
  id: string,
  tagId: number
): Promise<void> {
  await db.insert(bookmarkTagsTable).values({ bookmarkId: id, tagId });
}

export function bookmarkId(index: number): string {
  return `019fae92-3bb0-78cd-b488-${index.toString(16).padStart(12, "0")}`;
}
