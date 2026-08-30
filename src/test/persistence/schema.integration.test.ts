import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { LIBSQL_SERVER_IMAGE } from './libsql-server-image'
import { withPersistenceDb } from './migrated-db'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
const persistenceDir = fileURLToPath(new URL('.', import.meta.url))

describe('本番 migration を適用した libSQL', () => {
  const persistence = withPersistenceDb()

  test('Dockerfile と同じ libsql-server digest を使う', () => {
    const dockerfile = fs.readFileSync(path.join(repoRoot, 'Dockerfile'), 'utf8')
    expect(dockerfile).toContain(`FROM ${LIBSQL_SERVER_IMAGE}`)
  })

  test('空DBへ本番 migration を適用すると業務テーブルと履歴がある', async () => {
    const tables = await persistence
      .getClient()
      .execute("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    const names = tables.rows.map((row) => row['name'])

    expect(names).toEqual(
      expect.arrayContaining([
        '__drizzle_migrations',
        'accounts',
        'bookmark_tags',
        'bookmarks',
        'passkeys',
        'sessions',
        'tags',
        'users',
        'verifications'
      ])
    )
  })

  test('適用済み migration 名は drizzle フォルダと一致する', async () => {
    const folders = fs
      .readdirSync(path.join(repoRoot, 'drizzle'))
      .filter((name) => /^\d{14}_/.test(name))
      .toSorted()
    const applied = await persistence
      .getClient()
      .execute('SELECT name FROM __drizzle_migrations ORDER BY name')
    const names = applied.rows.map((row) => row['name'])

    expect(names).toEqual(folders)
  })

  test('Integration 用ソースは本番 schema を DDL で複製しない', () => {
    const ddl = new RegExp(['create', 'table'].join(String.raw`\s+`), 'i')
    const sources = fs
      .readdirSync(persistenceDir)
      .filter((name) => name.endsWith('.ts'))
      .map((name) => fs.readFileSync(path.join(persistenceDir, name), 'utf8'))
      .join('\n')

    expect(sources).not.toMatch(ddl)
  })
})
