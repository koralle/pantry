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
