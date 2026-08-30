import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { GenericContainer, Wait } from 'testcontainers'
import type { StartedTestContainer } from 'testcontainers'
import type { TestProject } from 'vitest/node'

import { LIBSQL_SERVER_IMAGE } from './libsql-server-image'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
const migrationsFolder = path.join(repoRoot, 'drizzle')

function libsqlHttpUrl(container: StartedTestContainer): string {
  return `http://${container.getHost()}:${container.getMappedPort(8080)}`
}

async function applyProductionMigrations(url: string): Promise<void> {
  const client = createClient({ url })
  try {
    const db = drizzle({ client })
    await migrate(db, { migrationsFolder })
  } finally {
    client.close()
  }
}

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const container = await new GenericContainer(LIBSQL_SERVER_IMAGE)
    .withExposedPorts(8080)
    .withTmpFs({ '/var/lib/sqld': 'rw,noexec,nosuid,size=64m' })
    .withWaitStrategy(Wait.forHttp('/v2', 8080))
    .withStartupTimeout(120_000)
    .start()

  const libsqlUrl = libsqlHttpUrl(container)
  await applyProductionMigrations(libsqlUrl)
  project.provide('libsqlUrl', libsqlUrl)

  return async () => {
    await container.stop()
  }
}
