# Seed Script Implementation Plan

> **For agentic workers:** REQUIRED SUB-LEVEL: Inline execution in this session. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `scripts/seed.ts` を完成させ、ローカル DB に user / tags / bookmarks / bookmark_tags のダミーデータを流せるようにする。

**Architecture:** Better Auth の `signUpEmail` API でユーザーを作り、残りのテーブルは `drizzle-seed` で生成する。実行前に `drizzle-seed/reset` で対象テーブルを空にする。

**Tech Stack:** TypeScript, drizzle-orm, drizzle-seed, better-auth, libsql, tsx, dotenvx

---

## Task 1: 環境変数と実行スクリプトを整える

**Files:**

- Modify: `.env.development`
- Modify: `package.json`

- [ ] **Step 1: `.env.development` に `BETTER_AUTH_SECRET` を追加する**

```text
DATABASE_URL=http://127.0.0.1:8080
BETTER_AUTH_SECRET=dev-secret-min-32-chars-for-local-only
```

- [ ] **Step 2: `package.json` に `db:seed` スクリプトを追加する**

```json
"db:seed": "pnpm dotenvx run -f .env.development -- pnpm tsx scripts/seed.ts"
```

---

## Task 2: `scripts/seed.ts` を実装する

**Files:**

- Modify: `scripts/seed.ts`

- [ ] **Step 1: 必要な import を追加する**

```ts
import { reset, seed } from 'drizzle-seed'

import { auth, db } from '../auth'
import * as authSchema from '../src/db/schema/auth-schema'
import { bookmarkTagsTable } from '../src/db/schema/bookmark-tag'
import { bookmarkTable } from '../src/db/schema/bookmark'
import { tagsTable } from '../src/db/schema/tag'
```

- [ ] **Step 2: スキーマ定数とターゲットユーザーを定義する**

```ts
const fullSchema = {
  ...authSchema,
  bookmark: bookmarkTable,
  bookmarkTags: bookmarkTagsTable,
  tags: tagsTable
}

const TARGET = {
  email: 'koralle@example.com',
  name: 'koralle',
  password: 'password'
} as const

const COUNTS = {
  tags: 500,
  bookmarks: 200,
  bookmarkTags: 300
} as const
```

- [ ] **Step 3: 一意な名前・URL リストを作るヘルパーを定義する**

```ts
const range = (length: number) => Array.from({ length }, (_, i) => i)

const tagNames = range(COUNTS.tags).map((i) => `tag-${String(i + 1).padStart(3, '0')}`)
const bookmarkUrls = range(COUNTS.bookmarks).map((i) => `https://example.com/bookmark/${i + 1}`)
```

- [ ] **Step 4: メイン処理を書く**

```ts
const main = async (): Promise<void> => {
  console.log('Resetting database...')
  await reset(db, fullSchema)

  console.log('Creating user...')
  const { user } = await auth.api.signUpEmail({
    body: {
      email: TARGET.email,
      password: TARGET.password,
      name: TARGET.name
    }
  })

  if (!user) {
    throw new Error('User creation failed')
  }

  console.log(`User created: ${user.id} (${user.email})`)

  console.log('Seeding tags, bookmarks, and bookmark_tags...')
  await seed(db, { tagsTable, bookmarkTable, bookmarkTagsTable }).refine((funcs) => ({
    tagsTable: {
      count: COUNTS.tags,
      columns: {
        userId: funcs.valuesFromArray({ values: [user.id] }),
        name: funcs.valuesFromArray({ values: tagNames, isUnique: true })
      }
    },
    bookmarkTable: {
      count: COUNTS.bookmarks,
      columns: {
        id: funcs.uuid(),
        userId: funcs.valuesFromArray({ values: [user.id] }),
        url: funcs.valuesFromArray({ values: bookmarkUrls, isUnique: true }),
        title: funcs.string({ isUnique: false })
      }
    },
    bookmarkTagsTable: {
      count: COUNTS.bookmarkTags
    }
  }))

  console.log('Seed complete.')
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
```

---

## Task 3: 動作確認する

**Files:**

- N/A

- [ ] **Step 1: ローカル DB サーバーが起動していることを確認する**

```bash
# 例: turso dev
```

- [ ] **Step 2: シードスクリプトを実行する**

```bash
pnpm run db:seed
```

- [ ] **Step 3: 期待される出力を確認する**

```text
Resetting database...
Creating user...
User created: <uuid> (koralle@example.com)
Seeding tags, bookmarks, and bookmark_tags...
Seed complete.
```

- [ ] **Step 4: エラーが出た場合は `bookmarkTagsTable` を直接 INSERT するフォールバックに切り替える**

```ts
const tagRows = await db.select({ id: tagsTable.id }).from(tagsTable).limit(COUNTS.bookmarkTags)
const bookmarkRows = await db
  .select({ id: bookmarkTable.id })
  .from(bookmarkTable)
  .limit(COUNTS.bookmarkTags)

const bookmarkTagValues = tagRows.map((tag, i) => ({
  bookmarkId: bookmarkRows[i % bookmarkRows.length].id,
  tagId: tag.id
}))

await db.insert(bookmarkTagsTable).values(bookmarkTagValues)
```

---

## Task 5: コミットする

**Files:**

- N/A

- [ ] **Step 1: 変更をステージしてコミットする**

```bash
git add scripts/seed.ts package.json docs/superpowers/
git commit -m "feat: add local DB seed script for user, tags, bookmarks and bookmark_tags"
```
