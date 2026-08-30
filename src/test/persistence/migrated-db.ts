import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as v from 'valibot'
import { afterAll, beforeAll, beforeEach, inject } from 'vitest'

import type { AppDb } from '../../db/app-db'
import { user } from '../../db/schema/auth-schema'
import { bookmarkTable } from '../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../db/schema/bookmark-tag'
import { tagsTable } from '../../db/schema/tag'
import { userIdSchema } from '../../features/auth/domain/auth-values'
import type { UserId } from '../../features/auth/domain/auth-values'

declare module 'vitest' {
  export interface ProvidedContext {
    libsqlUrl: string
  }
}

type PersistenceDb = {
  getDb: () => AppDb
  getClient: () => Client
}

function namesFrom(rows: readonly Record<string, unknown>[]): string[] {
  return rows.flatMap((row) => {
    const { name } = row
    return typeof name === 'string' && name.length > 0 ? [name] : []
  })
}

export async function resetPersistenceTables(client: Client): Promise<void> {
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%'"
  )
  const tableNames = namesFrom(tables.rows)
  const triggers = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'trigger' AND name NOT LIKE 'sqlite_%'"
  )
  const triggerNames = namesFrom(triggers.rows)
  const statements = [
    'PRAGMA foreign_keys = OFF',
    ...triggerNames.map((name) => `DROP TRIGGER IF EXISTS "${name.replaceAll('"', '""')}"`),
    ...tableNames.map((name) => `DELETE FROM "${name.replaceAll('"', '""')}"`),
    'PRAGMA foreign_keys = ON'
  ]
  await client.executeMultiple(statements.join(';\n'))
}

/**
 * 共有 libSQL へ接続し、各テスト前に行を空にする。
 * schema は globalSetup の本番 migration が作ったものを使う。
 */
export function withPersistenceDb(): PersistenceDb {
  let client: Client | undefined = undefined
  let db: AppDb | undefined = undefined

  beforeAll(() => {
    client = createClient({ url: inject('libsqlUrl') })
    db = drizzle({ client })
  })

  afterAll(() => {
    client?.close()
    client = undefined
    db = undefined
  })

  beforeEach(async () => {
    if (client === undefined) {
      throw new Error('persistence client is not initialized')
    }
    await resetPersistenceTables(client)
  })

  return {
    getDb: () => {
      if (db === undefined) {
        throw new Error('persistence db is not initialized')
      }
      return db
    },
    getClient: () => {
      if (client === undefined) {
        throw new Error('persistence client is not initialized')
      }
      return client
    }
  }
}

export async function seedUser(db: AppDb, id: string): Promise<UserId> {
  await db.insert(user).values({
    id,
    name: id,
    email: `${id}@example.com`
  })
  return v.parse(userIdSchema, id)
}

export async function seedTag(
  db: AppDb,
  input: { readonly userId: string; readonly name: string }
): Promise<number> {
  const inserted = await db
    .insert(tagsTable)
    .values({
      userId: input.userId,
      name: input.name,
      normalizedName: input.name.toLowerCase()
    })
    .returning({ id: tagsTable.id })
  const [row] = inserted
  if (row === undefined) {
    throw new Error('seedTag failed to return the inserted row')
  }
  return row.id
}

export async function seedBookmark(
  db: AppDb,
  input: {
    readonly id: string
    readonly userId: string
    readonly title?: string
    readonly url?: string
    readonly note?: string | null
    readonly createdAt?: Date
    readonly updatedAt?: Date
    readonly deletedAt?: Date | null
    readonly tagIds?: readonly number[]
  }
): Promise<void> {
  await db.insert(bookmarkTable).values({
    id: input.id,
    userId: input.userId,
    url: input.url ?? `https://example.com/${input.id}`,
    title: input.title ?? input.id,
    note: input.note ?? null,
    ...(input.createdAt === undefined ? {} : { createdAt: input.createdAt }),
    ...(input.updatedAt === undefined ? {} : { updatedAt: input.updatedAt }),
    ...(input.deletedAt === undefined ? {} : { deletedAt: input.deletedAt })
  })
  if (input.tagIds !== undefined && input.tagIds.length > 0) {
    await db.insert(bookmarkTagsTable).values(
      input.tagIds.map((tagId) => ({
        bookmarkId: input.id,
        tagId
      }))
    )
  }
}

export async function seedBookmarks(
  db: AppDb,
  rows: ReadonlyArray<Parameters<typeof seedBookmark>[1]>
): Promise<void> {
  if (rows.length === 0) {
    return
  }
  await db.insert(bookmarkTable).values(
    rows.map((input) => ({
      id: input.id,
      userId: input.userId,
      url: input.url ?? `https://example.com/${input.id}`,
      title: input.title ?? input.id,
      note: input.note ?? null,
      ...(input.createdAt === undefined ? {} : { createdAt: input.createdAt }),
      ...(input.updatedAt === undefined ? {} : { updatedAt: input.updatedAt }),
      ...(input.deletedAt === undefined ? {} : { deletedAt: input.deletedAt })
    }))
  )
  const tagRows = rows.flatMap((input) =>
    (input.tagIds ?? []).map((tagId) => ({
      bookmarkId: input.id,
      tagId
    }))
  )
  if (tagRows.length > 0) {
    await db.insert(bookmarkTagsTable).values(tagRows)
  }
}

export function bookmarkId(index: number): string {
  return `019fae92-3bb0-78cd-b488-${index.toString(16).padStart(12, '0')}`
}
