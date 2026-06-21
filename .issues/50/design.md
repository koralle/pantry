# post-checkout フックで .env 系ファイルの symlink を自動生成する

## 目的

`git worktree add` で新しい worktree を作成した際に、`.env` / `.env.development` が存在しないため手動コピーが必要になっている。
これを post-checkout フックで自動的に symlink を貼ることで、worktree 作成直後から env ファイルが使える状態にする。

## 要件

- トリガー: `git worktree add` 実行時のみ（通常のブランチ切り替えでは発火させない）
- 対象ファイル: `.env`, `.env.development`
- symlink 元: メインリポジトリのルートにある実体ファイル
- symlink 先: worktree のルートディレクトリ
- 冪等性: 既に対象ファイルが存在する場合は何もしない
- 実装: TypeScript + tsx（tsx は既存の devDependency）

## 設計

### 検出ロジック

git worktree の判定には `git rev-parse --git-dir` と `git rev-parse --git-common-dir` の比較を用いる。

- メインリポジトリ: `--git-dir` と `--git-common-dir` が同一パスを返す
- worktree: `--git-dir` は `.git/worktrees/<name>`、`--git-common-dir` はメインの `.git` を返す

### スクリプト: `scripts/symlink-env-for-worktree.ts`

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

### Lefthook 設定

`lefthook.yaml` に `post-checkout` セクションを追加する。

```yaml
post-checkout:
  scripts:
    - name: Symlink env files for worktree
      run: pnpm tsx scripts/symlink-env-for-worktree.ts
```

スクリプト内で worktree 検出を行うため、`lefthook.yaml` 側の分岐は不要。
通常の checkout では `isGitWorktree()` が `false` を返して早期終了する。

### エラーハンドリング

- `git rev-parse` が git リポジトリ外で失敗した場合 → 例外が throw されスクリプトが終了する（post-checkout フックは git リポジトリ内でしか実行されないため問題ない）
- 元ファイルが存在しない場合 → warn ログを出力してそのファイルをスキップ
- symlink 作成失敗（権限不足など）→ 例外が throw される

## 非機能要件

- スクリプトは `pnpm tsx scripts/symlink-env-for-worktree.ts` で手動実行も可能
- 出力は stdout/stderr にログを書き、Lefthook の実行ログで確認できる
