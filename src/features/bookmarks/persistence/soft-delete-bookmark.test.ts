import { createClient } from '@libsql/client'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import type { AppDb } from '../../../db/app-db'
import { user } from '../../../db/schema/auth-schema'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { userIdSchema } from '../../auth/domain/auth-values'
import type { SoftDeleteBookmarkInput } from '../application/delete-bookmark'
import { softDeleteBookmark } from './soft-delete-bookmark'

const bookmarkId = '019fae92-3bb0-78cd-b488-65ce0e26a001'

/**
 * Libsql の `:memory:` は workerd で動かないので、このファイルは Node project で走らせる。
 * 本番と同じ UNIQUE `(user_id, url)` と soft delete 列を置く。
 */
async function createMemoryDb(): Promise<AppDb> {
  const client = createClient({ url: ':memory:' })
  const db = drizzle({ client })

  await db.run(sql`
    CREATE TABLE users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      role TEXT,
      banned INTEGER,
      ban_reason TEXT,
      ban_expires INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  await db.run(sql`
    CREATE TABLE bookmarks (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      note TEXT,
      created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
      updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
      deleted_at INTEGER,
      UNIQUE (user_id, url)
    )
  `)

  return db
}

async function insertUser(db: AppDb, id: string) {
  await db.insert(user).values({ id, name: id, email: `${id}@example.com` })
}

async function insertBookmark(
  db: AppDb,
  input: {
    id: string
    userId: string
    url?: string
    deletedAt?: Date | null
  }
) {
  const now = new Date('2026-08-01T00:00:00.000Z')
  await db.insert(bookmarkTable).values({
    id: input.id,
    userId: input.userId,
    url: input.url ?? `https://example.com/${input.id}`,
    title: 'タイトル',
    createdAt: now,
    updatedAt: now,
    deletedAt: input.deletedAt ?? null
  })
}

async function selectBookmarkRow(db: AppDb, id: string) {
  const [row] = await db.select().from(bookmarkTable).where(eq(bookmarkTable.id, id))
  return row
}

function command(userId: string, id: string): SoftDeleteBookmarkInput {
  return { userId: v.parse(userIdSchema, userId), id }
}

describe('softDeleteBookmark', () => {
  test('所有済み未削除行に deletedAt と updatedAt を設定する', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertBookmark(db, { id: bookmarkId, userId: 'user-a' })

    const result = await softDeleteBookmark(db, command('user-a', bookmarkId))

    expect(result).toEqual({ kind: 'deleted', id: bookmarkId })
    const row = await selectBookmarkRow(db, bookmarkId)
    expect(row?.deletedAt).not.toBeNull()
    expect(row?.updatedAt.getTime()).toBeGreaterThan(new Date('2026-08-01T00:00:00.000Z').getTime())
  })

  test('別ユーザーの行は削除せず bookmark-not-found を返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertUser(db, 'user-b')
    await insertBookmark(db, { id: bookmarkId, userId: 'user-a' })

    const result = await softDeleteBookmark(db, command('user-b', bookmarkId))

    expect(result).toEqual({ kind: 'bookmark-not-found' })
    const row = await selectBookmarkRow(db, bookmarkId)
    expect(row?.deletedAt).toBeNull()
  })

  test('削除済みの行は更新せず bookmark-not-found を返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    const deletedAt = new Date('2026-08-05T00:00:00.000Z')
    await insertBookmark(db, { id: bookmarkId, userId: 'user-a', deletedAt })
    const before = await selectBookmarkRow(db, bookmarkId)

    const result = await softDeleteBookmark(db, command('user-a', bookmarkId))

    expect(result).toEqual({ kind: 'bookmark-not-found' })
    const after = await selectBookmarkRow(db, bookmarkId)
    expect(after?.deletedAt?.getTime()).toBe(deletedAt.getTime())
    expect(after?.updatedAt.getTime()).toBe(before?.updatedAt.getTime())
  })

  test('存在しない id は bookmark-not-found を返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')

    const result = await softDeleteBookmark(db, command('user-a', bookmarkId))

    expect(result).toEqual({ kind: 'bookmark-not-found' })
  })
})
