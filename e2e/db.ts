import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'

import type { AppDb } from '../src/db/app-db'
import { user } from '../src/db/schema/auth-schema'
import { bookmarkTable } from '../src/db/schema/bookmark'
import { bookmarkTagsTable } from '../src/db/schema/bookmark-tag'
import { tagsTable } from '../src/db/schema/tag'
import { E2E_USER } from './constants'

type E2eDbConnection = {
  readonly client: Client
  readonly db: AppDb
  readonly close: () => void
}

export type SeedBookmarkInput = {
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

function namesFrom(rows: readonly Record<string, unknown>[]): string[] {
  return rows.flatMap((row) => {
    const { name } = row
    return typeof name === 'string' && name.length > 0 ? [name] : []
  })
}

export function createE2eClient(url: string): E2eDbConnection {
  const client = createClient({ url })
  const db = drizzle({ client })
  return { client, db, close: () => client.close() }
}

export function createE2eDb(url: string): E2eDbConnection {
  return createE2eClient(url)
}

export async function resetApplicationTables(client: Client): Promise<void> {
  await client.executeMultiple(
    [
      'PRAGMA foreign_keys = OFF',
      'DELETE FROM "bookmarks"',
      'DELETE FROM "bookmark_tags"',
      'DELETE FROM "tags"',
      'PRAGMA foreign_keys = ON'
    ].join(';\n')
  )
}

export async function resetAllDataTables(client: Client): Promise<void> {
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%'"
  )
  const tableNames = namesFrom(tables.rows)
  const statements = [
    'PRAGMA foreign_keys = OFF',
    ...tableNames.map((name) => `DELETE FROM "${name.replaceAll('"', '""')}"`),
    'PRAGMA foreign_keys = ON'
  ]
  await client.executeMultiple(statements.join(';\n'))
}

export async function findE2eUserId(db: AppDb): Promise<string> {
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, E2E_USER.email))
    .limit(1)
  if (row === undefined) {
    throw new Error(`E2E user not found: ${E2E_USER.email}`)
  }
  return row.id
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

export async function seedBookmark(db: AppDb, input: SeedBookmarkInput): Promise<void> {
  await db.insert(bookmarkTable).values({
    id: input.id,
    userId: input.userId,
    url: input.url ?? `https://example.test/${input.id}`,
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
  rows: ReadonlyArray<SeedBookmarkInput>
): Promise<void> {
  if (rows.length === 0) {
    return
  }
  await db.insert(bookmarkTable).values(
    rows.map((input) => ({
      id: input.id,
      userId: input.userId,
      url: input.url ?? `https://example.test/${input.id}`,
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
