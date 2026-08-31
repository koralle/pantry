import { copyFileSync, existsSync, mkdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { E2E_BETTER_AUTH_SECRET, E2E_ORIGIN, E2E_TURSO_AUTH_TOKEN } from './constants'
import { runtimeDir } from './runtime'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const devVarsFile = path.join(repoRoot, '.dev.vars')
const backupFile = path.join(runtimeDir, 'dev.vars.backup')

let overlayActive = false

function assertLocalLibsqlUrl(libsqlUrl: string): void {
  const url = new URL(libsqlUrl)
  const isLocalHostname = url.hostname === '127.0.0.1' || url.hostname === 'localhost'

  if (url.protocol !== 'http:' || !isLocalHostname || url.hostname.includes('turso.io')) {
    throw new Error(`Refusing non-local E2E libSQL URL: ${libsqlUrl}`)
  }
}

export function restoreDevVars(): void {
  if (!overlayActive) {
    return
  }

  if (existsSync(backupFile)) {
    renameSync(backupFile, devVarsFile)
  } else if (existsSync(devVarsFile)) {
    unlinkSync(devVarsFile)
  }

  overlayActive = false
}

export function writeE2eDevVars(libsqlUrl: string): void {
  assertLocalLibsqlUrl(libsqlUrl)
  mkdirSync(runtimeDir, { recursive: true })

  if (existsSync(devVarsFile) && !existsSync(backupFile)) {
    copyFileSync(devVarsFile, backupFile)
  }

  overlayActive = true
  try {
    writeFileSync(
      devVarsFile,
      [
        `TURSO_CONNECTION_URL=${libsqlUrl}`,
        `TURSO_AUTH_TOKEN=${E2E_TURSO_AUTH_TOKEN}`,
        `BETTER_AUTH_SECRET=${E2E_BETTER_AUTH_SECRET}`,
        `BETTER_AUTH_URL=${E2E_ORIGIN}`,
        ''
      ].join('\n'),
      'utf8'
    )
  } catch (error) {
    restoreDevVars()
    throw error
  }
}
