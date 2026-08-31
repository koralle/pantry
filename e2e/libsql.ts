import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { GenericContainer, Wait } from 'testcontainers'
import type { StartedTestContainer } from 'testcontainers'

import { LIBSQL_SERVER_IMAGE } from '../src/test/persistence/libsql-server-image'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const migrationsFolder = path.join(repoRoot, 'drizzle')

async function applyProductionMigrations(url: string): Promise<void> {
  const client = createClient({ url })
  try {
    const db = drizzle({ client })
    await migrate(db, { migrationsFolder })
  } finally {
    client.close()
  }
}

export async function startMigratedLibsql(): Promise<{
  readonly container: StartedTestContainer
  readonly libsqlUrl: string
}> {
  const container = await new GenericContainer(LIBSQL_SERVER_IMAGE)
    .withExposedPorts(8080)
    .withTmpFs({ '/var/lib/sqld': 'rw,noexec,nosuid,size=64m' })
    .withWaitStrategy(Wait.forHttp('/v2', 8080))
    .withStartupTimeout(120_000)
    .start()

  try {
    const libsqlUrl = `http://127.0.0.1:${container.getMappedPort(8080)}`
    await applyProductionMigrations(libsqlUrl)
    return { container, libsqlUrl }
  } catch (error) {
    await container.stop()
    throw error
  }
}
