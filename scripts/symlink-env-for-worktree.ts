import { exec } from 'node:child_process'
import { access, symlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const ENV_FILES = ['.env', '.env.development'] as const

const EXIT_FAILURE = 1

const execAsync = promisify(exec)

async function isGitWorktree(): Promise<boolean> {
  const [gitDir, commonDir] = await Promise.all([
    execAsync('git rev-parse --git-dir', { encoding: 'utf8' }).then((r) => r.stdout.trim()),
    execAsync('git rev-parse --git-common-dir', { encoding: 'utf8' }).then((r) => r.stdout.trim())
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
    await execAsync('git rev-parse --git-common-dir', { encoding: 'utf8' })
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

try {
  await main()
} catch (error) {
  console.error('Failed to symlink env files:', error)
  process.exit(EXIT_FAILURE)
}
