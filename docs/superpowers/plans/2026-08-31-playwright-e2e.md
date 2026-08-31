# Playwright E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chromium から `@cloudflare/vite-plugin` のローカル Worker runtime と Testcontainers libSQL を通して、Pantry の主要ユーザーフローを Playwright Test で自動検証し、Pull Request の blocking check にする。

**Architecture:** Playwright の `webServer` は `e2e/start-pantry.ts` を起動する。このスクリプトが Testcontainers の libSQL を先に立ち上げ、本番と同じ Drizzle migration を適用し、Worker 用 `.dev.vars` を E2E 専用値へ差し替えてから `pnpm vite dev --host 127.0.0.1 --port 3100` を子プロセスとして起動する。主要 E2E は外部 HTTP に依存せずタイトルは手入力する。`https://example.com` の実アクセス smoke は別 script / 別 workflow に分離する。

**Tech Stack:** Playwright Test 1.62.1、Chromium、`@cloudflare/vite-plugin` + Vite 8 + workerd、Testcontainers 12.1.0、libSQL、Drizzle migrator、Better Auth `auth.api.createUser`

**Spec:** GitHub Issue #258（Issue 本文が仕様の正本。この plan は How のみ）

## Global Constraints

- 主要 E2E は任意の外部 Web サイトや第三者サービスの可用性へ依存しない。
- 外部 Turso の認証情報・既存データを使用しない。
- E2E 用の認証情報・fixture を本番環境と共有しない。
- Cloudflare Workers と異なる Node 固有 runtime だけで主要 E2E を成立させない。`pnpm vite dev`（既存 `vite.config.ts` の `cloudflare({ viteEnvironment: { name: 'ssr' } })`）以外のサーバーで主要 E2E を起動しない。
- flaky なテストを retry の常用で隠蔽しない（`retries: 0`）。
- 通常の `pnpm test` へ Browser / Docker 依存を持ち込まない。
- 本番アプリケーションへユーザーから到達可能なテスト専用認証 API を追加しない。
- development seed（`pnpm run db:seed` / `scripts/seed.ts`）を流用しない。
- Firefox / WebKit / mobile viewport / Passkey E2E / 並列実行 / Visual Regression は対象外。
- Issue 本文の受け入れ条件を狭めたり、観測可能な振る舞いを独断で変えない。

## File map

- Create: `playwright.config.ts` — 主要 E2E の Playwright 設定
- Create: `playwright.smoke.config.ts` — smoke 専用設定（main config を spread）
- Create: `e2e/constants.ts` — origin / 認証情報 / secret の定数
- Create: `e2e/runtime.ts` — Testcontainers URL をテスト側へ渡す gitignored ファイル
- Create: `e2e/dev-vars.ts` — `.dev.vars` の backup / 上書き / restore
- Create: `e2e/libsql.ts` — Testcontainers 起動と本番 migration
- Create: `e2e/start-pantry.ts` — webServer オーケストレーション
- Create: `e2e/db.ts` — libSQL client、table reset、bookmark/tag seed
- Create: `e2e/auth-user.ts` — Better Auth で E2E ユーザー作成
- Create: `e2e/fixtures.ts` — authenticated fixture（DB reset）
- Create: `e2e/auth.setup.ts` — storageState 作成
- Create: `e2e/sign-in.spec.ts`
- Create: `e2e/create-bookmark.spec.ts`
- Create: `e2e/edit-bookmark.spec.ts`
- Create: `e2e/search-and-filter.spec.ts`
- Create: `e2e/pagination.spec.ts`
- Create: `e2e/delete-bookmark.spec.ts`
- Create: `e2e/isolation.spec.ts`
- Create: `e2e/fetch-title.smoke.spec.ts`
- Create: `.github/workflows/e2e-smoke.yaml`
- Modify: `pnpm-workspace.yaml` — `catalogs.test['@playwright/test'] = 1.62.1`
- Modify: `package.json` — devDependency と scripts
- Modify: `pnpm-lock.yaml` — `pnpm install` が更新
- Modify: `knip.config.ts` — Playwright / e2e entry
- Modify: `.gitignore` — Playwright 成果物と runtime
- Modify: `.github/workflows/ci.yaml` — blocking `e2e` job
- Modify: `docs/testing.md` — Playwright Test を自動 E2E の正本として追記
- Modify: `AGENTS.md` — `pnpm run test:e2e` / `test:e2e:smoke` をコマンド表へ追加

## Locked values

Copy these exact values. Do not invent alternatives.

```ts
export const E2E_HOST = '127.0.0.1'
export const E2E_PORT = 3100
export const E2E_ORIGIN = 'http://127.0.0.1:3100'
export const E2E_TURSO_AUTH_TOKEN = 'e2e-local-unused'
export const E2E_BETTER_AUTH_SECRET = 'e2e-local-better-auth-secret-001'
export const E2E_USER = {
  email: 'e2e@pantry.test',
  name: 'e2e',
  password: 'e2e-password-not-for-production'
} as const
```

`E2E_BETTER_AUTH_SECRET` is 32 characters. Do not reuse `scripts/create-user.ts` (`koralle@example.com` / `password`).

libSQL image: import `LIBSQL_SERVER_IMAGE` from `src/test/persistence/libsql-server-image.ts`.

Playwright: `@playwright/test` `1.62.1` via `catalog:test`.

Scripts:

- `test` remains `vitest run` (no Playwright, no Docker).
- `test:e2e` = `playwright test`
- `test:e2e:smoke` = `playwright test --config playwright.smoke.config.ts`

CI job name: `e2e` (this is the blocking check name).
Smoke workflow name: `E2E external HTTP smoke`. Job name: `e2e-smoke`.
Smoke schedule: `0 6 * * 1` (Monday 06:00 UTC) plus `workflow_dispatch`.

Auth strategy:

- One spec (`e2e/sign-in.spec.ts`) performs UI email/password sign-in.
- Other specs start from Playwright `storageState` produced by `e2e/auth.setup.ts` (UI sign-in once per run). That setup is test harness, not a user-reachable auth API.
- `beforeEach` in authenticated fixtures truncates `bookmarks`, `bookmark_tags`, and `tags` only. Keep `users` / `sessions` / `accounts` so storageState stays valid.

Title fetch:

- Main suite never clicks `タイトルを取得`. Type the title.
- Smoke suite clicks `タイトルを取得` against `https://example.com`.

Worker env isolation:

- `reuseExistingServer` is always `false`. Never attach to a developer's `pnpm dev`.
- `e2e/start-pantry.ts` backs up existing `.dev.vars` (if any), writes E2E-only values, starts Vite, restores `.dev.vars` on shutdown. This prevents a local Turso `.dev.vars` from being used.
- Guard: `TURSO_CONNECTION_URL` written to `.dev.vars` must be `http://127.0.0.1:<port>` (or `http://localhost:<port>`). Reject any host containing `turso.io`.

Playwright:

- `fullyParallel: false`
- `workers: 1`
- `retries: 0`
- Chromium only
- desktop viewport (Playwright default is fine; do not add mobile projects)
- `timeout: 30_000` for tests; `webServer.timeout: 180_000`

PATH: this environment's default `node` may be v22 via `/exec-daemon`. Use `/usr/bin/node` (v24) for pnpm commands: `export PATH="/usr/bin:$PATH"`.

---

### Task 1: E2E harness and sign-in page boot

**Files:**

- Modify: `pnpm-workspace.yaml`
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `knip.config.ts`
- Create: `e2e/constants.ts`
- Create: `e2e/runtime.ts`
- Create: `e2e/dev-vars.ts`
- Create: `e2e/libsql.ts`
- Create: `e2e/start-pantry.ts`
- Create: `playwright.config.ts`
- Create: `e2e/sign-in.spec.ts` (first assertion only: `/sign-in` heading; full login comes in Task 2)
- Test: `e2e/sign-in.spec.ts`

**Interfaces:**

- Consumes: existing `vite.config.ts` Cloudflare plugin, `LIBSQL_SERVER_IMAGE`, Drizzle `migrate` from persistence global setup
- Produces: `E2E_ORIGIN` serving Pantry on workerd; `e2e/.runtime/runtime.json` with `{ "libsqlUrl": string }`; `pnpm run test:e2e`

- [ ] **Step 1: Add Playwright dependency**

In `pnpm-workspace.yaml` catalogs.test, add after `vitest`:

```yaml
'@playwright/test': 1.62.1
```

In `package.json` `devDependencies` add:

```json
    "@playwright/test": "catalog:test",
```

Add scripts next to `test:persistence`:

```json
    "test:e2e": "playwright test",
    "test:e2e:smoke": "playwright test --config playwright.smoke.config.ts",
```

`.gitignore` append:

```
# Playwright E2E
/playwright-report/
/test-results/
/blob-report/
/e2e/.auth/
/e2e/.runtime/
```

Keep `!.dev.vars.example`. Do not gitignore `.dev.vars` handling beyond the existing `.dev.vars*` rule.

`knip.config.ts`:

- Add `'playwright.config.ts'` and `'playwright.smoke.config.ts'` and `'e2e/start-pantry.ts'` to `entry`.
- Add knip playwright plugin config:

```ts
  playwright: {
    config: ['playwright.config.ts', 'playwright.smoke.config.ts'],
    entry: ['e2e/**/*.ts']
  },
```

Do not add `@playwright/test` to `ignoreDependencies`.

Run:

```bash
export PATH="/usr/bin:$PATH"
pnpm install
pnpm exec playwright install chromium
```

Expected: lockfile updates; Chromium installs.

- [ ] **Step 2: Write the failing boot test**

Create `e2e/constants.ts` with the locked values above.

Create `e2e/sign-in.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('サインインページにログイン見出しが表示される', async ({ page }) => {
  await page.goto('/sign-in')
  await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
})
```

Create a minimal `playwright.config.ts` that points `webServer.command` at `pnpm exec tsx e2e/start-pantry.ts` even if that file is still a stub. Do not implement start-pantry yet.

```ts
import { defineConfig, devices } from '@playwright/test'

import { E2E_ORIGIN } from './e2e/constants'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter:
    process.env['GITHUB_ACTIONS'] === 'true' ? [['github'], ['html']] : [['list'], ['html']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: E2E_ORIGIN,
    viewport: { width: 1280, height: 720 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'pnpm exec tsx e2e/start-pantry.ts',
    url: E2E_ORIGIN,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
    gracefulShutdown: { signal: 'SIGTERM', timeout: 20_000 }
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'sign-in',
      testMatch: /sign-in\.spec\.ts/,
      dependencies: [],
      use: { storageState: { cookies: [], origins: [] } }
    },
    {
      name: 'main',
      testMatch: /.*\.spec\.ts/,
      testIgnore: [/sign-in\.spec\.ts/, /fetch-title\.smoke\.spec\.ts/],
      dependencies: ['setup'],
      use: { storageState: 'e2e/.auth/user.json' }
    }
  ]
})
```

For this task only, temporarily comment out the `setup` project and `main` project (or give `sign-in` no dependencies and leave setup file absent). If Playwright errors because `auth.setup.ts` is missing, keep only the `sign-in` project until Task 2. Task 2 restores the three-project layout.

- [ ] **Step 3: Run the boot test and confirm it fails for the missing server**

```bash
export PATH="/usr/bin:$PATH"
pnpm run test:e2e
```

Expected: FAIL because `e2e/start-pantry.ts` does not exist or does not serve `E2E_ORIGIN`. Do not implement the harness until you have seen this failure.

- [ ] **Step 4: Implement the harness**

`e2e/runtime.ts`:

```ts
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
export const runtimeDir = path.join(repoRoot, 'e2e/.runtime')
const runtimeFile = path.join(runtimeDir, 'runtime.json')

export type E2eRuntime = {
  readonly libsqlUrl: string
}

export async function writeRuntime(runtime: E2eRuntime): Promise<void> {
  await mkdir(runtimeDir, { recursive: true })
  await writeFile(runtimeFile, `${JSON.stringify(runtime, null, 2)}\n`, 'utf8')
}

export async function readRuntime(): Promise<E2eRuntime> {
  const parsed: unknown = JSON.parse(await readFile(runtimeFile, 'utf8'))
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('libsqlUrl' in parsed) ||
    typeof parsed.libsqlUrl !== 'string'
  ) {
    throw new Error('e2e/.runtime/runtime.json is missing libsqlUrl')
  }
  return { libsqlUrl: parsed.libsqlUrl }
}
```

`e2e/dev-vars.ts` must:

1. Resolve repo-root `.dev.vars`.
2. If `.dev.vars` exists and `e2e/.runtime/dev.vars.backup` does not, copy it to the backup.
3. Write:

```
TURSO_CONNECTION_URL=<libsqlUrl>
TURSO_AUTH_TOKEN=e2e-local-unused
BETTER_AUTH_SECRET=e2e-local-better-auth-secret-001
BETTER_AUTH_URL=http://127.0.0.1:3100
```

4. `restoreDevVars()`: if backup exists, move it back to `.dev.vars`; else unlink `.dev.vars` if we created it. Always run from SIGINT/SIGTERM/exit.

Reject `libsqlUrl` unless the host is `127.0.0.1` or `localhost`, protocol is `http:`, and hostname does not include `turso.io`.

`e2e/libsql.ts`:

Copy the container options from `src/test/persistence/global-setup.ts` (same image, port 8080, tmpfs `/var/lib/sqld`, wait `/v2`, 120s startup). Apply production migrations with `drizzle-orm/libsql/migrator` and `migrationsFolder = <repoRoot>/drizzle`. Return `{ container, libsqlUrl }` where `libsqlUrl = http://127.0.0.1:${mappedPort}`.

`e2e/start-pantry.ts`:

```ts
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

import {
  E2E_BETTER_AUTH_SECRET,
  E2E_HOST,
  E2E_ORIGIN,
  E2E_PORT,
  E2E_TURSO_AUTH_TOKEN
} from './constants'
import { restoreDevVars, writeE2eDevVars } from './dev-vars'
import { startMigratedLibsql } from './libsql'
import { writeRuntime } from './runtime'

const childEnv = {
  ...process.env,
  TURSO_CONNECTION_URL: libsqlUrl,
  TURSO_AUTH_TOKEN: E2E_TURSO_AUTH_TOKEN,
  BETTER_AUTH_SECRET: E2E_BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: E2E_ORIGIN
}

const vite = spawn('pnpm', ['vite', 'dev', '--host', E2E_HOST, '--port', String(E2E_PORT)], {
  env: childEnv,
  stdio: 'inherit'
})
```

Order: start libSQL → migrate → writeRuntime → writeE2eDevVars → spawn vite. Do not spawn a Node HTTP server. On signal: kill vite, stop container, restoreDevVars.

Keep the process alive until vite exits. If vite exits non-zero before SIGTERM, exit with that code after cleanup.

- [ ] **Step 5: Re-run the boot test**

```bash
export PATH="/usr/bin:$PATH"
pnpm run test:e2e
```

Expected: PASS. The heading `ログイン` is visible. Confirm start-pantry logs `Using secrets defined in .dev.vars` or equivalent wrangler/vite secret load, and that `libsqlUrl` in `e2e/.runtime/runtime.json` is `http://127.0.0.1:<port>`.

If Chromium is missing, run `pnpm exec playwright install chromium` and re-run. If Docker socket is unreachable, the harness should fail with Testcontainers' error — do not fall back to Turso.

- [ ] **Step 6: Commit**

```bash
export PATH="/usr/bin:$PATH"
git add pnpm-workspace.yaml package.json pnpm-lock.yaml .gitignore knip.config.ts playwright.config.ts e2e
git commit -m "$(cat <<'EOF'
chore(e2e): Playwright を Testcontainers libSQL と workerd に接続する

EOF
)"
```

---

### Task 2: UI sign-in spec and authenticated storageState

**Files:**

- Create: `e2e/db.ts`
- Create: `e2e/auth-user.ts`
- Create: `e2e/auth.setup.ts`
- Create: `e2e/fixtures.ts`
- Modify: `playwright.config.ts` — restore setup / sign-in / main projects
- Modify: `e2e/sign-in.spec.ts` — full UI sign-in
- Create: `e2e/isolation.spec.ts`

**Interfaces:**

- Consumes: `readRuntime().libsqlUrl`, `E2E_USER`, Better Auth `auth.api.createUser`
- Produces: `e2e/.auth/user.json`; `test` from `e2e/fixtures.ts` that resets bookmark/tag tables before each test

- [ ] **Step 1: Write failing UI sign-in assertions**

Replace `e2e/sign-in.spec.ts` with:

```ts
import { expect, test } from '@playwright/test'

import { E2E_USER } from './constants'

test('メールアドレスとパスワードでサインインするとブックマーク一覧が表示される', async ({
  page
}) => {
  await page.goto('/sign-in')
  await page.getByRole('textbox', { name: 'メール' }).fill(E2E_USER.email)
  await page.getByRole('textbox', { name: 'パスワード' }).fill(E2E_USER.password)
  await page.getByRole('button', { name: 'サインイン' }).click()
  await expect(page).toHaveURL(/\/(\?.*)?$/)
  await expect(page.getByRole('link', { name: '新規' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'ログイン' })).toHaveCount(0)
  await expect(page.getByText('まだブックマークがありません')).toBeVisible()
})
```

Do not use `storageState` in this file. The `sign-in` project must set `storageState: { cookies: [], origins: [] }`.

- [ ] **Step 2: Run to verify it fails**

```bash
export PATH="/usr/bin:$PATH"
pnpm run test:e2e -- e2e/sign-in.spec.ts
```

Expected: FAIL (invalid credentials or redirect to sign-in) because the E2E user is not created yet.

- [ ] **Step 3: Implement user seed, setup project, and fixtures**

`e2e/db.ts`:

- `createE2eClient(url)` using `createClient({ url })` from `@libsql/client` and `drizzle({ client })`.
- `resetApplicationTables(client)`: same SQL as `resetPersistenceTables` in `src/test/persistence/migrated-db.ts` but **only** delete from `bookmarks`, `bookmark_tags`, and `tags` (quote identifiers). Do not delete `users`, `sessions`, `accounts`, `verifications`, `passkeys`.
- `resetAllDataTables(client)`: delete every non-sqlite / non-`__drizzle` table (copy `resetPersistenceTables`). Used only by `auth.setup.ts` before creating the user, so each run starts from a clean auth+data state.
- `seedTag` / `seedBookmark` / `seedBookmarks`: same column mapping as `migrated-db.ts` (`normalizedName: name.toLowerCase()`, default URL `https://example.test/${id}` — not `example.com` in the main suite). Use `https://example.test/...` so main E2E never even looks like it depends on example.com.

`e2e/auth-user.ts`:

```ts
export function applyE2eProcessEnv(libsqlUrl: string): void {
  process.env['TURSO_CONNECTION_URL'] = libsqlUrl
  process.env['TURSO_AUTH_TOKEN'] = E2E_TURSO_AUTH_TOKEN
  process.env['BETTER_AUTH_SECRET'] = E2E_BETTER_AUTH_SECRET
  process.env['BETTER_AUTH_URL'] = E2E_ORIGIN
}

export async function ensureE2eUser(libsqlUrl: string): Promise<void> {
  applyE2eProcessEnv(libsqlUrl)
  const { auth } = await import('../auth')
  await auth.api.createUser({
    body: {
      email: E2E_USER.email,
      name: E2E_USER.name,
      password: E2E_USER.password
    }
  })
}
```

Import `auth.ts` only after `applyE2eProcessEnv`. `auth.ts` reads `env` at import time.

If `createUser` throws because the email exists, that is a harness bug (setup should have truncated users). Do not swallow it.

`e2e/auth.setup.ts`:

```ts
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { test as setup, expect } from '@playwright/test'

import { ensureE2eUser } from './auth-user'
import { E2E_USER } from './constants'
import { createE2eClient, resetAllDataTables } from './db'
import { readRuntime } from './runtime'

const authFile = path.join(import.meta.dirname, '.auth/user.json')

setup('認証済み状態を保存する', async ({ page }) => {
  const { libsqlUrl } = await readRuntime()
  const { client, close } = createE2eClient(libsqlUrl)
  try {
    await resetAllDataTables(client)
  } finally {
    close()
  }
  await ensureE2eUser(libsqlUrl)
  await page.goto('/sign-in')
  await page.getByRole('textbox', { name: 'メール' }).fill(E2E_USER.email)
  await page.getByRole('textbox', { name: 'パスワード' }).fill(E2E_USER.password)
  await page.getByRole('button', { name: 'サインイン' }).click()
  await expect(page.getByRole('link', { name: '新規' })).toBeVisible()
  await mkdir(path.dirname(authFile), { recursive: true })
  await page.context().storageState({ path: authFile })
})
```

`e2e/fixtures.ts`:

```ts
import { test as base } from '@playwright/test'

import { createE2eClient, resetApplicationTables } from './db'
import { readRuntime } from './runtime'

export const test = base.extend<{ resetData: void }>({
  resetData: [
    async ({}, use) => {
      const { libsqlUrl } = await readRuntime()
      const { client, close } = createE2eClient(libsqlUrl)
      try {
        await resetApplicationTables(client)
        await use()
      } finally {
        close()
      }
    },
    { auto: true }
  ]
})

export { expect } from '@playwright/test'
```

`playwright.config.ts` projects (final):

```ts
projects: [
  { name: 'setup', testMatch: /auth\.setup\.ts/ },
  {
    name: 'sign-in',
    testMatch: /sign-in\.spec\.ts/,
    dependencies: ['setup'],
    use: { storageState: { cookies: [], origins: [] } }
  },
  {
    name: 'main',
    testMatch: /.*\.spec\.ts/,
    testIgnore: [/sign-in\.spec\.ts/, /fetch-title\.smoke\.spec\.ts/],
    dependencies: ['setup'],
    use: { storageState: 'e2e/.auth/user.json' }
  }
]
```

`sign-in` depends on `setup` so the user exists, but uses empty storageState so the spec actually types credentials.

`e2e/isolation.spec.ts` uses `test` from `./fixtures` (so it gets `resetData`):

```ts
import { expect, test } from './fixtures'

test.describe.serial('fixture の独立性', () => {
  test('先のテストが入れたブックマークは後続へ漏れない', async ({ page }) => {
    const { libsqlUrl } = await readRuntime()
    const { db, close } = createE2eDb(libsqlUrl)
    try {
      const userId = await findE2eUserId(db)
      await seedBookmark(db, {
        id: bookmarkId(1),
        userId,
        title: 'LeakProbe',
        url: 'https://example.test/leak-probe'
      })
    } finally {
      close()
    }
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'LeakProbe' })).toBeVisible()
  })

  test('後続テストは空のブックマーク表から始まる', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('まだブックマークがありません')).toBeVisible()
    await expect(page.getByRole('link', { name: 'LeakProbe' })).toHaveCount(0)
  })
})
```

Expose `createE2eDb` / `findE2eUserId` / `bookmarkId` from `e2e/db.ts`. `findE2eUserId` selects `users.id` where email is `E2E_USER.email`. `bookmarkId` can match persistence (`019fae92-3bb0-78cd-b488-${index.toString(16).padStart(12, '0')}`).

- [ ] **Step 4: Run sign-in and isolation**

```bash
export PATH="/usr/bin:$PATH"
pnpm run test:e2e -- e2e/sign-in.spec.ts e2e/isolation.spec.ts e2e/auth.setup.ts
```

Expected: PASS. Sign-in uses the form. Isolation second test does not see `LeakProbe`.

- [ ] **Step 5: Commit**

```bash
git add e2e playwright.config.ts
git commit -m "$(cat <<'EOF'
chore(e2e): メールサインインと認証済み storageState を追加する

EOF
)"
```

---

### Task 3: Create, edit tags, and delete

**Files:**

- Create: `e2e/create-bookmark.spec.ts`
- Create: `e2e/edit-bookmark.spec.ts`
- Create: `e2e/delete-bookmark.spec.ts`
- Test: those three files

**Interfaces:**

- Consumes: `test` from `e2e/fixtures.ts`; `seedTag` / `seedBookmark` / `findE2eUserId`
- Produces: browser-observable coverage for Issue scenarios 2, 3, 6

Do not click `タイトルを取得`. Fill タイトル manually. Use URLs on `https://example.test/...`.

- [ ] **Step 1: Write failing create spec**

`e2e/create-bookmark.spec.ts`:

```ts
import { expect, test } from './fixtures'

test('ブックマークを作成すると一覧から確認できる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: '新規' }).click()
  await page.getByLabel('URL').fill('https://example.test/created')
  await page.getByLabel('タイトル').fill('Created from E2E')
  await page.getByRole('button', { name: '登録' }).click()
  await expect(page.getByRole('heading', { name: 'Created from E2E' })).toBeVisible()
  await page.getByRole('link', { name: '一覧へ戻る' }).click()
  await expect(page.getByRole('link', { name: 'Created from E2E' })).toBeVisible()
})
```

- [ ] **Step 2: Run create spec to verify it fails**

```bash
export PATH="/usr/bin:$PATH"
pnpm run test:e2e -- e2e/create-bookmark.spec.ts
```

Expected: FAIL until the flow is wired (should fail on missing link/heading if setup is broken; if it already passes because the app works, that is acceptable **only after** you watched it fail once against a missing assertion — if the app already implements create, the red step is the test file not existing. Run before adding the spec if needed, or assert a unique title that is not seeded.)

Because create already exists in the app, the new spec should fail first if storageState/setup is missing; with Task 2 complete it may pass immediately. That is OK for this spec: the production behavior already exists. Do not change application code to make create pass. If it fails, fix the selector (labels are `URL` / `タイトル`, submit is `登録`, detail heading is `h1.workbenchTitle`).

- [ ] **Step 3: Write edit and delete specs**

`e2e/edit-bookmark.spec.ts`:

Seed two tags `keep-tag` and `drop-tag`, and a bookmark titled `Editable` with only `drop-tag`. Then:

1. `page.goto('/')`
2. Click link `Editable`
3. Click link `編集`
4. Click `タグを選ぶ`
5. Select `keep-tag` (getByRole('option', { name: 'keep-tag' }) or checkbox/button inside the dialog `タグを選ぶ`)
6. Remove `drop-tag` via `getByRole('button', { name: 'drop-tagを外す' })`
7. Optionally edit title to `Editable updated`
8. Click `更新`
9. Expect heading `Editable updated` (or `Editable` if title unchanged)
10. Expect visible text `keep-tag`
11. Expect `drop-tag` count 0
12. Go 一覧へ戻る and confirm the same tag state on the list (`keep-tag` chip visible, `drop-tag` absent)

Inspect `BookmarkTagPicker` if option roles differ; prefer role/accessible name, not CSS classes.

`e2e/delete-bookmark.spec.ts`:

Seed bookmark titled `Doomed`. Open detail, click `削除`, click `削除を確認`, expect list empty / `Doomed` count 0, and `まだブックマークがありません` visible.

- [ ] **Step 4: Run the three specs**

```bash
export PATH="/usr/bin:$PATH"
pnpm run test:e2e -- e2e/create-bookmark.spec.ts e2e/edit-bookmark.spec.ts e2e/delete-bookmark.spec.ts
```

Expected: PASS. Adjust selectors only; do not add a test auth API or mock oRPC.

- [ ] **Step 5: Commit**

```bash
git add e2e/create-bookmark.spec.ts e2e/edit-bookmark.spec.ts e2e/delete-bookmark.spec.ts e2e/db.ts
git commit -m "$(cat <<'EOF'
chore(e2e): ブックマーク作成・タグ編集・削除を検証する

EOF
)"
```

---

### Task 4: Search, tag filter, and cursor pagination

**Files:**

- Create: `e2e/search-and-filter.spec.ts`
- Create: `e2e/pagination.spec.ts`

**Interfaces:**

- Consumes: `seedBookmarks`, `seedTag`, `BOOKMARK_LIST_PAGE_SIZE` from `src/features/bookmarks/lib/bookmark-list-page-size.ts`
- Produces: coverage for Issue scenarios 4 and 5

- [ ] **Step 1: Write failing search/filter spec**

Seed:

- Tag `rust`, tag `python`
- Bookmark `Alpha rust` with tag rust, url `https://example.test/alpha`
- Bookmark `Beta python` with tag python, url `https://example.test/beta`
- Bookmark `Gamma both` with both tags

Cases in one file, separate `test()`s (each gets `resetData`, so seed in each test):

1. Search: fill placeholder `タイトル・URL・メモ` with `Alpha`, click button `検索`. Expect `Alpha rust` visible, `Beta python` count 0, `Gamma both` count 0.
2. Tag filter: `page.getByRole('navigation', { name: 'タグ' }).getByRole('link', { name: /rust/ }).click()`. Expect `Alpha rust` and `Gamma both` visible, `Beta python` count 0.

- [ ] **Step 2: Run search spec to see it fail or pass**

```bash
export PATH="/usr/bin:$PATH"
pnpm run test:e2e -- e2e/search-and-filter.spec.ts
```

Fix selectors if the search field's accessible name is `検索` (SearchField + sr-only Label). Placeholder is `タイトル・URL・メモ`.

- [ ] **Step 3: Write pagination spec**

```ts
import { BOOKMARK_LIST_PAGE_SIZE } from '../src/features/bookmarks/lib/bookmark-list-page-size'
```

Seed `BOOKMARK_LIST_PAGE_SIZE + 2` bookmarks. Titles:

- First page (newest): `Keep ${String(i).padStart(2, '0')}` for `i = 0 .. PAGE_SIZE-1` with `createdAt = base + (PAGE_SIZE + 1 - i) * 1000`
- Extra older rows: `Next Page Alpha`, `Next Page Beta` with earlier `createdAt`

`page.goto('/')`.

Expect `Keep 00` visible and `Next Page Alpha` count 0.
Expect button `さらに読み込む` visible.
Click it.
Expect `Keep 00` still visible **and** `Next Page Alpha` visible (existing items kept, new items appended).
Expect `Next Page Beta` visible too.

Do not reload the page between assertions.

- [ ] **Step 4: Run pagination**

```bash
export PATH="/usr/bin:$PATH"
pnpm run test:e2e -- e2e/pagination.spec.ts e2e/search-and-filter.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add e2e/search-and-filter.spec.ts e2e/pagination.spec.ts
git commit -m "$(cat <<'EOF'
chore(e2e): 検索・タグ絞り込みと cursor pagination を検証する

EOF
)"
```

---

### Task 5: External HTTP smoke, CI blocking job, and docs

**Files:**

- Create: `e2e/fetch-title.smoke.spec.ts`
- Create: `playwright.smoke.config.ts`
- Create: `.github/workflows/e2e-smoke.yaml`
- Modify: `.github/workflows/ci.yaml`
- Modify: `docs/testing.md`
- Modify: `AGENTS.md`
- Modify: `knip.config.ts` if smoke config is not already listed

**Interfaces:**

- Consumes: authenticated `storageState` via a smoke config that still starts `e2e/start-pantry.ts`
- Produces: `pnpm run test:e2e:smoke`; PR job `e2e`; scheduled/manual job `e2e-smoke`

- [ ] **Step 1: Write the smoke spec**

`e2e/fetch-title.smoke.spec.ts`:

```ts
import { expect, test } from './fixtures'

test('https://example.com のタイトル取得結果がフォームに反映される', async ({ page }) => {
  await page.goto('/bookmarks/new')
  await page.getByLabel('URL').fill('https://example.com')
  await page.getByRole('button', { name: 'タイトルを取得' }).click()
  await expect(page.getByLabel('タイトル')).toHaveValue(/example/i)
})
```

`example.com`'s title is typically `Example Domain`. Assert `/example/i` so a trivial wording change does not flake; do not retry.

- [ ] **Step 2: Add smoke config that is not used by `pnpm run test:e2e`**

`playwright.smoke.config.ts`:

```ts
import config from './playwright.config'

export default {
  ...config,
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'smoke',
      testMatch: /fetch-title\.smoke\.spec\.ts/,
      dependencies: ['setup'],
      use: { storageState: 'e2e/.auth/user.json' }
    }
  ]
}
```

Confirm `pnpm run test:e2e` does **not** run the smoke spec (`testIgnore` already lists it in main).

- [ ] **Step 3: Add CI jobs**

In `.github/workflows/ci.yaml`, add job `e2e` after `persistence-integration`, same `ubuntu-24.04` + cache-and-install composite:

```yaml
e2e:
  runs-on: ubuntu-24.04

  steps:
    - name: Checkout
      uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2

    - name: Setup
      uses: ./.github/composite-actions/cache-and-install

    - name: Install Playwright Chromium
      shell: bash
      run: |
        pnpm exec playwright install --with-deps chromium

    - name: Playwright E2E
      shell: bash
      run: |
        pnpm run test:e2e

    - name: Upload Playwright report
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 7
```

Pin `actions/upload-artifact` to a commit SHA like other actions in this repo (look up the current v4 SHA used in GitHub if needed; do not use a floating major tag if the rest of the workflow pins SHAs). If looking up SHA is blocked, match the repo's existing pin style by searching other workflows; `osv-scanner.yaml` / `security.yaml` may already pin `upload-artifact`.

`.github/workflows/e2e-smoke.yaml`:

```yaml
name: E2E external HTTP smoke

on:
  schedule:
    - cron: '0 6 * * 1'
  workflow_dispatch:

permissions:
  contents: read

jobs:
  e2e-smoke:
    runs-on: ubuntu-24.04
    steps:
      - name: Checkout
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
      - name: Setup
        uses: ./.github/composite-actions/cache-and-install
      - name: Install Playwright Chromium
        shell: bash
        run: pnpm exec playwright install --with-deps chromium
      - name: Playwright external HTTP smoke
        shell: bash
        run: pnpm run test:e2e:smoke
```

This workflow must **not** use `pull_request`. Do not add the smoke job to `ci.yaml`.

- [ ] **Step 4: Docs**

`docs/testing.md`: add section **2.3 Playwright E2E（実ブラウザ + ローカル Worker）** after 2.2:

- Command `pnpm run test:e2e` (Docker + Chromium)
- Path: Chromium → UI → TanStack Query → oRPC → UseCase → Drizzle → Testcontainers libSQL
- Runtime is `@cloudflare/vite-plugin` / `pnpm vite dev`, not a Node-only server
- PR CI job `e2e` is the blocking check; adding it to GitHub ruleset as required is the same operational note as `persistence-integration`
- `pnpm test` stays Docker/Browser-free
- `pnpm run test:e2e:smoke` hits `https://example.com`; workflow `E2E external HTTP smoke` is weekly + manual; not a merge gate

Update section 3 heading to clarify Playwright MCP remains exploratory/manual, while Playwright Test is the automated suite.

`AGENTS.md` command table: add `pnpm run test:e2e` and `pnpm run test:e2e:smoke`.

- [ ] **Step 5: Verify script split**

```bash
export PATH="/usr/bin:$PATH"
pnpm run test
```

Expected: Vitest only; no Playwright, no Docker container start. (Persistence is `test:persistence`, not `test`.)

```bash
pnpm run test:e2e
```

Expected: setup + sign-in + main specs; smoke spec not in the list.

Do not fail the task if `test:e2e:smoke` cannot reach example.com in a locked-down network; the spec and workflow must still exist. On GitHub-hosted runners it should run. If this Cloud environment blocks egress to example.com, record that in the PR 仕様との差異 as an environment limitation, not a spec change.

- [ ] **Step 6: Commit**

```bash
git add e2e/fetch-title.smoke.spec.ts playwright.smoke.config.ts .github/workflows/ci.yaml .github/workflows/e2e-smoke.yaml docs/testing.md AGENTS.md knip.config.ts
git commit -m "$(cat <<'EOF'
chore(e2e): 主要フローを PR CI の blocking check にし smoke を分離する

EOF
)"
```

---

## Self-review

**Spec coverage:**

| Issue requirement                                       | Task                                                    |
| ------------------------------------------------------- | ------------------------------------------------------- |
| Local Chromium Playwright                               | 1                                                       |
| `@cloudflare/vite-plugin` / workerd via `pnpm vite dev` | 1                                                       |
| Testcontainers libSQL, no Turso                         | 1 (URL guard + `.dev.vars` overlay)                     |
| Same production migrations                              | 1 (`e2e/libsql.ts`)                                     |
| UI email/password sign-in → list                        | 2                                                       |
| Create → list                                           | 3                                                       |
| Edit tags add/remove                                    | 3                                                       |
| Search and tag filter                                   | 4                                                       |
| Cursor pagination keeps old rows and appends            | 4                                                       |
| Delete → gone                                           | 3                                                       |
| Non-sign-in tests skip UI login                         | 2 (`storageState`)                                      |
| Consecutive runs / no leftover DB                       | 2 (`isolation.spec.ts` + `resetAllDataTables` in setup) |
| PR blocking `e2e` job                                   | 5                                                       |
| example.com smoke manual                                | 5 (`pnpm run test:e2e:smoke`, `workflow_dispatch`)      |
| example.com smoke scheduled, not merge gate             | 5 (cron, not in `ci.yaml`)                              |
| `pnpm test` without Browser/Docker                      | 5                                                       |

**Placeholder scan:** no TBD/TODO. Exact constants, scripts, selectors, and commands are inlined.

**Type consistency:** `E2E_ORIGIN`, `E2E_USER`, `readRuntime()`, `storageState: 'e2e/.auth/user.json'`, job name `e2e` are reused as written.
