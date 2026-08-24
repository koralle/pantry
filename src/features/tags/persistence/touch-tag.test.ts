import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { user } from '../../../db/schema/auth-schema'
import { tagsTable } from '../../../db/schema/tag'
import { userIdSchema } from '../../auth/domain/auth-values'
import type { InsertTagInput } from '../application/create-tag'
import type { TouchTagInput } from '../application/touch-tag'
import { tagNameSchema } from '../domain/tag-values'
import { insertTag } from './insert-tag'
import { touchTag } from './touch-tag'

/**
 * Libsql の `:memory:` は workerd で動かないので、このファイルは Node project で走らせる。
 * UPDATE ... RETURNING の有無で touched / not-found を決めるため、本物の SQLite へ載せる。
 */
async function createMemoryDb() {
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
    CREATE TABLE tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      color TEXT,
      last_used_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
      updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
      version INTEGER NOT NULL DEFAULT 1,
      UNIQUE (user_id, normalized_name)
    )
  `)

  return db
}

async function insertUser(db: Awaited<ReturnType<typeof createMemoryDb>>, id: string) {
  await db.insert(user).values({
    id,
    name: id,
    email: `${id}@example.com`
  })
}

function parseUserId(value: string) {
  return v.parse(userIdSchema, value)
}

function parseName(value: string) {
  return v.parse(tagNameSchema, value)
}

async function createOwnedTag(
  db: Awaited<ReturnType<typeof createMemoryDb>>,
  userId: string,
  name: string
) {
  const input: InsertTagInput = {
    userId: parseUserId(userId),
    name: parseName(name),
    pinned: false,
    sortOrder: 0,
    color: null
  }
  const result = await insertTag(db, input)
  if (result.kind !== 'created') {
    throw new Error('tag creation failed in test setup')
  }
  return result.id
}

function touchInput(userId: string, id: number): TouchTagInput {
  return {
    userId: parseUserId(userId),
    id: v.parse(v.pipe(v.number(), v.brand('TagId')), id)
  }
}

describe('touchTag', () => {
  test('actor のタグの lastUsedAt を更新し touched を返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    const id = await createOwnedTag(db, 'user-a', 'Work')

    const before = await db.select({ lastUsedAt: tagsTable.lastUsedAt }).from(tagsTable)
    expect(before[0]?.lastUsedAt).toBeNull()

    const result = await touchTag(db, touchInput('user-a', Number(id)))

    expect(result).toEqual({ kind: 'touched' })
    const after = await db.select({ lastUsedAt: tagsTable.lastUsedAt }).from(tagsTable)
    expect(after[0]?.lastUsedAt).not.toBeNull()
  })

  test('別ユーザーのタグは更新せず not-found を返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertUser(db, 'user-b')
    const id = await createOwnedTag(db, 'user-b', 'Work')

    const result = await touchTag(db, touchInput('user-a', Number(id)))

    expect(result).toEqual({ kind: 'not-found' })
    const rows = await db.select({ lastUsedAt: tagsTable.lastUsedAt }).from(tagsTable)
    expect(rows[0]?.lastUsedAt).toBeNull()
  })

  test('存在しない id は not-found を返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')

    const result = await touchTag(db, touchInput('user-a', 999))

    expect(result).toEqual({ kind: 'not-found' })
  })

  test('同一タグへの並行 touch は両方 touched になり、行は1件のまま', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    const id = await createOwnedTag(db, 'user-a', 'Work')

    const input = touchInput('user-a', Number(id))
    const [first, second] = await Promise.all([touchTag(db, input), touchTag(db, input)])

    expect(first).toEqual({ kind: 'touched' })
    expect(second).toEqual({ kind: 'touched' })
    const rows = await db.select({ lastUsedAt: tagsTable.lastUsedAt }).from(tagsTable)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.lastUsedAt).not.toBeNull()
  })
})
