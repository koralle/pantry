# post-checkout フックで .env 系ファイルの symlink を自動生成する 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `git worktree add` 実行時に `.env` と `.env.development` をメインリポジトリから worktree へ自動 symlink する

**Architecture:** TypeScript スクリプト (`scripts/symlink-env-for-worktree.ts`) を Lefthook の `post-checkout` フックから呼び出す。worktree 判定は `git rev-parse --git-dir` ≠ `git rev-parse --git-common-dir` で行う

**Tech Stack:** Node.js (child_process, fs/promises), tsx, Lefthook

---

### Task 1: スクリプト作成 `scripts/symlink-env-for-worktree.ts`

**Files:**

- Create: `scripts/symlink-env-for-worktree.ts`

- [ ] **Step 1: スクリプトを書く**

```typescript
import { exec } from 'node:child_process'
import { access, symlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const ENV_FILES = ['.env', '.env.development']

const execAsync = promisify(exec)

async function isGitWorktree(): Promise<boolean> {
  const [gitDir, commonDir] = await Promise.all([
    execAsync('git rev-parse --git-dir', { encoding: 'utf-8' }).then((r) => r.stdout.trim()),
    execAsync('git rev-parse --git-common-dir', { encoding: 'utf-8' }).then((r) => r.stdout.trim())
  ])
  return gitDir !== commonDir
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function main(): Promise<void> {
  if (!(await isGitWorktree())) {
    console.log('Not a git worktree. Skipping.')
    return
  }

  const commonDir = (
    await execAsync('git rev-parse --git-common-dir', { encoding: 'utf-8' })
  ).stdout.trim()
  const mainRepoRoot = resolve(commonDir, '..')

  for (const file of ENV_FILES) {
    const source = resolve(mainRepoRoot, file)
    const target = resolve(process.cwd(), file)

    if (!(await exists(source))) {
      console.warn(`Source ${source} not found. Skipping ${file}.`)
      continue
    }

    if (await exists(target)) {
      console.log(`${file} already exists. Skipping.`)
      continue
    }

    await symlink(source, target)
    console.log(`Symlinked ${target} -> ${source}`)
  }
}

main()
```

- [ ] **Step 2: 手動実行で動作確認（worktree ではないので早期終了する）**

Run: `pnpm tsx scripts/symlink-env-for-worktree.ts`
Expected output: `Not a git worktree. Skipping.`

- [ ] **Step 3: Commit**

```bash
git add scripts/symlink-env-for-worktree.ts
git commit -m "feat: add worktree env symlink script"
```

### Task 2: Lefthook に post-checkout フックを追加

**Files:**

- Modify: `lefthook.yaml`

- [ ] **Step 1: lefthook.yaml の末尾に post-checkout セクションを追加**

```yaml
post-checkout:
  scripts:
    - name: Symlink env files for worktree
      run: pnpm tsx scripts/symlink-env-for-worktree.ts
```

- [ ] **Step 2: 構文チェック**

Run: `pnpm lefthook validate`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lefthook.yaml
git commit -m "feat: add post-checkout hook for worktree env symlink"
```
