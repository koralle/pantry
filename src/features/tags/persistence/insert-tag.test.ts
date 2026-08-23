import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { user } from '../../../db/schema/auth-schema'
import { tagsTable } from '../../../db/schema/tag'
import { userIdSchema } from '../../auth/domain/auth-values'
import type { InsertTagInput } from '../application/create-tag'
import { tagNameSchema } from '../domain/tag-values'
import { insertTag } from './insert-tag'

const persistenceDir = dirname(fileURLToPath(import.meta.url))

function parseUserId(value: string) {
  return v.parse(userIdSchema, value)
}

function parseName(value: string) {
  return v.parse(tagNameSchema, value)
}

function createCommand(
  userId: string,
  name: string,
  extras: Partial<Pick<InsertTagInput, 'pinned' | 'sortOrder' | 'color'>> = {}
): InsertTagInput {
  return {
    userId: parseUserId(userId),
    name: parseName(name),
    pinned: extras.pinned ?? false,
    sortOrder: extras.sortOrder ?? 0,
    color: extras.color ?? null
  }
}

/**
 * Libsql の `:memory:` は workerd で動かないので、このファイルは Node project で走らせる。
 * UNIQUE `(user_id, normalized_name)` を本番スキーマと同じ形で置き、衝突判定を本物の制約に乗せる。
 */
async function createMemoryDb() {
  const client = createClient({ url: ':memory:' }),
    db = drizzle({ client })

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

describe('insertTag', () => {
  test('same user and normalized name returns name-conflict', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')

    const first = await insertTag(db, createCommand('user-a', 'Work')),
      second = await insertTag(db, createCommand('user-a', 'work'))

    expect(first.kind).toBe('created')
    expect(second).toEqual({ kind: 'name-conflict' })
  })

  test('a different user can create the same tag name', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertUser(db, 'user-b')

    const first = await insertTag(db, createCommand('user-a', 'Work')),
      second = await insertTag(db, createCommand('user-b', 'Work'))

    expect(first.kind).toBe('created')
    expect(second.kind).toBe('created')
  })

  test('concurrent inserts for the same user and name yield created and name-conflict', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')

    const [left, right] = await Promise.all([
        insertTag(db, createCommand('user-a', 'Inbox')),
        insertTag(db, createCommand('user-a', 'Inbox'))
      ]),
      kinds = [left.kind, right.kind].toSorted()
    expect(kinds).toEqual(['created', 'name-conflict'])

    const rows = await db.select({ id: tagsTable.id }).from(tagsTable)
    expect(rows).toHaveLength(1)
  })

  test('does not import the generic unique-error classifier', () => {
    const source = readFileSync(join(persistenceDir, 'insert-tag.ts'), 'utf8')
    expect(source).not.toContain('isSqliteUniqueConstraintError')
  })
})
