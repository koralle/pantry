import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

import type { StartedTestContainer } from 'testcontainers'

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

let container: StartedTestContainer | undefined
let vite: ChildProcess | undefined
let cleanupPromise: Promise<void> | undefined
let shutdownRequested = false

function waitForChildExit(child: ChildProcess): Promise<{
  readonly code: number | null
  readonly signal: NodeJS.Signals | null
}> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve({ code: child.exitCode, signal: child.signalCode })
  }

  return new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => resolve({ code, signal }))
  })
}

async function stopVite(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return
  }

  const exited = waitForChildExit(child)
  child.kill('SIGTERM')
  const stopped = await Promise.race([exited.then(() => true), delay(5000, false)])

  if (!stopped) {
    child.kill('SIGKILL')
    await exited
  }
}

async function cleanupResources(): Promise<void> {
  const runningVite = vite
  vite = undefined

  try {
    if (runningVite) {
      await stopVite(runningVite)
    }
  } finally {
    const runningContainer = container
    container = undefined
    let stopContainer: Promise<unknown> | undefined

    try {
      if (runningContainer) {
        stopContainer = runningContainer.stop()
      }
    } finally {
      // Playwright can end its command shell before asynchronous container shutdown settles.
      restoreDevVars()
    }

    if (stopContainer) {
      await stopContainer
    }
  }
}

async function cleanup(): Promise<void> {
  if (cleanupPromise) {
    return cleanupPromise
  }

  cleanupPromise = cleanupResources()
  try {
    await cleanupPromise
  } finally {
    cleanupPromise = undefined
  }
}

function requestShutdown(): void {
  shutdownRequested = true
  void cleanup().catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
}

process.once('SIGINT', requestShutdown)
process.once('SIGTERM', requestShutdown)
process.once('exit', restoreDevVars)

async function main(): Promise<void> {
  try {
    const started = await startMigratedLibsql()
    container = started.container
    const { libsqlUrl } = started

    if (shutdownRequested) {
      return
    }

    await writeRuntime({ libsqlUrl })
    writeE2eDevVars(libsqlUrl)

    if (shutdownRequested) {
      return
    }

    const childEnv = {
      ...process.env,
      TURSO_CONNECTION_URL: libsqlUrl,
      TURSO_AUTH_TOKEN: E2E_TURSO_AUTH_TOKEN,
      BETTER_AUTH_SECRET: E2E_BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: E2E_ORIGIN
    }

    vite = spawn('pnpm', ['vite', 'dev', '--host', E2E_HOST, '--port', String(E2E_PORT)], {
      env: childEnv,
      stdio: 'inherit'
    })

    const result = await waitForChildExit(vite)
    if (!shutdownRequested && result.code !== 0) {
      process.exitCode = result.code ?? 1
    }
  } catch (error) {
    if (!shutdownRequested) {
      console.error(error)
      process.exitCode = 1
    }
  } finally {
    await cleanup()
  }
}

await main()
