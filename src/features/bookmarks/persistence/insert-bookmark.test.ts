import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import * as v from 'valibot'
import { afterAll, describe, expect, test } from 'vitest'

import { user } from '../../../db/schema/auth-schema'
import { bookmarkTable } from '../../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../../db/schema/bookmark-tag'
import { tagsTable } from '../../../db/schema/tag'
import { userIdSchema } from '../../auth/domain/auth-values'
import { tagIdSchema } from '../../tags/domain/tag-values'
import type { TagId } from '../../tags/domain/tag-values'
import type { InsertBookmarkInput } from '../application/create-bookmark'
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from '../domain/bookmark-values'
import { insertBookmark } from './insert-bookmark'

const persistenceDir = dirname(fileURLToPath(import.meta.url))

type MemoryDb = Awaited<ReturnType<typeof createMemoryDb>>

function parseUserId(value: string) {
  return v.parse(userIdSchema, value)
}

function createCommand(
  userId: string,
  overrides: {
    url?: string
    title?: string
    note?: string | null
    tagIds?: number[]
  } = {}
): InsertBookmarkInput {
  return {
    userId: parseUserId(userId),
    url: v.parse(bookmarkUrlSchema, overrides.url ?? 'https://example.com/article'),
    title: v.parse(bookmarkTitleSchema, overrides.title ?? 'Example Article'),
    note: v.parse(bookmarkNoteSchema, overrides.note ?? null),
    tagIds: (overrides.tagIds ?? []).map((id) => v.parse(tagIdSchema, id))
  }
}

/**
 * `:memory:` は transaction のたびに接続が張り替わり、空の DB に落ちるため使えない
 * (@libsql/client sqlite3 dialect は transaction 後に新 connection を lazily 張る)。
 * transaction を actual に走らせるため、test ごとに file DB を tmp に作る。
 */
const tempRoots: string[] = []

async function createMemoryDb() {
  const dir = mkdtempSync(join(tmpdir(), 'insert-bookmark-'))
  tempRoots.push(dir)
  const client = createClient({ url: `file:${join(dir, 'test.db')}` })
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

  await db.run(sql`
    CREATE TABLE bookmark_tags (
      bookmark_id TEXT NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE (bookmark_id, tag_id)
    )
  `)

  return db
}

afterAll(() => {
  for (const dir of tempRoots) {
    rmSync(dir, { recursive: true, force: true })
  }
})

async function insertUser(db: MemoryDb, id: string) {
  await db.insert(user).values({
    id,
    name: id,
    email: `${id}@example.com`
  })
}

async function insertTag(db: MemoryDb, userId: string, name: string): Promise<TagId> {
  const [row] = await db
    .insert(tagsTable)
    .values({
      userId: parseUserId(userId),
      name,
      normalizedName: name.toLowerCase()
    })
    .returning({ id: tagsTable.id })
  if (row === undefined) {
    throw new Error('tag insert returned no row')
  }
  return v.parse(tagIdSchema, row.id)
}

describe('insertBookmark', () => {
  test('ブックマークを作成し UUIDv7 の id を返す', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')

    const output = await insertBookmark(db, createCommand('user-a'))

    expect(output.kind).toBe('created')
    if (output.kind !== 'created') {
      return
    }
    expect(v.parse(bookmarkIdSchema, output.id)).toBeDefined()

    const rows = await db.select().from(bookmarkTable)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: output.id,
      userId: parseUserId('user-a'),
      url: 'https://example.com/article',
      title: 'Example Article',
      note: null
    })
  })

  test('同一ユーザーの同一 URL は duplicate-url を返し、行は増えない', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')

    const first = await insertBookmark(
      db,
      createCommand('user-a', { url: 'https://example.com/dup' })
    )
    const second = await insertBookmark(
      db,
      createCommand('user-a', { url: 'https://example.com/dup' })
    )

    expect(first.kind).toBe('created')
    expect(second).toEqual({ kind: 'duplicate-url' })

    const rows = await db.select({ id: bookmarkTable.id }).from(bookmarkTable)
    expect(rows).toHaveLength(1)
  })

  test('別ユーザーなら同じ URL を作成できる', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertUser(db, 'user-b')

    const first = await insertBookmark(
      db,
      createCommand('user-a', { url: 'https://example.com/shared' })
    )
    const second = await insertBookmark(
      db,
      createCommand('user-b', { url: 'https://example.com/shared' })
    )

    expect(first.kind).toBe('created')
    expect(second.kind).toBe('created')
  })

  test('所有タグを紐付け、そのタグの lastUsedAt だけを更新する', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertUser(db, 'user-other')
    const workTagId = await insertTag(db, 'user-a', 'Work')
    const laterTagId = await insertTag(db, 'user-a', 'Later')

    const output = await insertBookmark(
      db,
      createCommand('user-a', { tagIds: [workTagId, laterTagId] })
    )

    expect(output.kind).toBe('created')
    if (output.kind !== 'created') {
      return
    }

    const links = await db.select().from(bookmarkTagsTable)
    expect(links).toEqual([
      { bookmarkId: output.id, tagId: workTagId },
      { bookmarkId: output.id, tagId: laterTagId }
    ])

    const rows = await db.select().from(tagsTable)
    const byId = new Map(rows.map((row) => [row.id, row]))
    expect(byId.get(workTagId)?.lastUsedAt).not.toBeNull()
    expect(byId.get(laterTagId)?.lastUsedAt).not.toBeNull()
  })

  test('タグなしでは bookmark_tags も lastUsedAt も触れない', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    const workTagId = await insertTag(db, 'user-a', 'Work')

    const output = await insertBookmark(db, createCommand('user-a'))

    expect(output.kind).toBe('created')
    expect(await db.select().from(bookmarkTagsTable)).toHaveLength(0)
    const [tagRow] = await db.select().from(tagsTable)
    expect(tagRow?.id).toBe(workTagId)
    expect(tagRow?.lastUsedAt).toBeNull()
  })

  test('重複した tagIds は 1 行だけ紐付ける', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    const workTagId = await insertTag(db, 'user-a', 'Work')

    const output = await insertBookmark(
      db,
      createCommand('user-a', { tagIds: [workTagId, workTagId] })
    )

    expect(output.kind).toBe('created')
    if (output.kind !== 'created') {
      return
    }
    expect(await db.select().from(bookmarkTagsTable)).toEqual([
      { bookmarkId: output.id, tagId: workTagId }
    ])
  })

  test('別ユーザーのタグは invalid-tag で、bookmark も書かない', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    await insertUser(db, 'user-b')
    const foreignTagId = await insertTag(db, 'user-b', 'Foreign')

    const output = await insertBookmark(db, createCommand('user-a', { tagIds: [foreignTagId] }))

    expect(output).toEqual({ kind: 'invalid-tag' })
    expect(await db.select().from(bookmarkTable)).toHaveLength(0)
    expect(await db.select().from(bookmarkTagsTable)).toHaveLength(0)
  })

  test('存在しないタグは invalid-tag で、bookmark も書かない', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')

    const output = await insertBookmark(
      db,
      createCommand('user-a', { tagIds: [v.parse(tagIdSchema, 999)] })
    )

    expect(output).toEqual({ kind: 'invalid-tag' })
    expect(await db.select().from(bookmarkTable)).toHaveLength(0)
  })

  test('transaction 内の未知障害は throw され、部分書き込みが残らない', async () => {
    const db = await createMemoryDb()
    await insertUser(db, 'user-a')
    const workTagId = await insertTag(db, 'user-a', 'Work')
    await db.run(sql`
      CREATE TRIGGER block_bookmark_tags
      BEFORE INSERT ON bookmark_tags
      BEGIN
        SELECT RAISE(ABORT, 'blocked');
      END;
    `)

    await expect(
      insertBookmark(db, createCommand('user-a', { tagIds: [workTagId] }))
    ).rejects.toThrow()

    expect(await db.select().from(bookmarkTable)).toHaveLength(0)
    expect(await db.select().from(bookmarkTagsTable)).toHaveLength(0)
  })

  test('SQLite error 分類は import しない', () => {
    const source = readFileSync(join(persistenceDir, 'insert-bookmark.ts'), 'utf8')
    expect(source).not.toContain('isSqliteUniqueConstraintError')
    expect(source).not.toContain('SQLITE_CONSTRAINT')
  })
})
