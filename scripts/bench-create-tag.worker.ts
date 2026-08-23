import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { env } from 'cloudflare:workers'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import * as v from 'valibot'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import { user } from '../src/db/schema/auth-schema'
import { tagsTable } from '../src/db/schema/tag'
import { resolveTursoConnection } from '../src/db/turso-connection'
import { userIdSchema } from '../src/features/auth/domain/auth-values'
import { tagNameSchema } from '../src/features/tags/domain/tag-values'
import { insertTag } from '../src/features/tags/persistence/insert-tag'
import { createAppRouter } from '../src/rpc/create-app-router'
import type { AppRouter } from '../src/rpc/create-app-router'
import { handleRpcRequest } from '../src/rpc/handle-request.server'

/**
 * CreateTag の workerd 往復を測る。既定の `pnpm test` には載せない。
 * warmup と本測定が Turso 相当の DB を書き換えるため、計測用 config からの起動に限る。
 */
const WARMUP = 10,
 SAMPLES = 50,
 benchUserId = v.parse(userIdSchema, `bench-create-tag-${crypto.randomUUID()}`)

function percentile(values: readonly number[], p: number): number {
  const sorted = [...values].toSorted((a, b) => a - b),
   index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[index]!
}

function summarize(label: string, samples: readonly number[]): { median: number; p95: number } {
  const median = percentile(samples, 50),
   p95 = percentile(samples, 95)
  console.log(`${label}: n=${samples.length} median=${median.toFixed(2)}ms p95=${p95.toFixed(2)}ms`)
  return { median, p95 }
}

const db = drizzle({
  connection: resolveTursoConnection(env)
})

function createBenchClient() {
  const router = createAppRouter({
    getSession: async () => ({ user: { id: benchUserId } }),
    insertTag: async (input) => insertTag(db, input)
  }),
   link = new RPCLink({
    url: 'https://pantry.test/api/rpc',
    fetch: async (request) => handleRpcRequest(request, router)
  }),
   client: RouterClient<AppRouter> = createORPCClient(link)
  return client
}

async function legacyCreateTag(name: string): Promise<void> {
  const parsed = v.parse(tagNameSchema, name),
   existing = await db
    .select({ id: tagsTable.id })
    .from(tagsTable)
    .where(and(eq(tagsTable.userId, benchUserId), eq(tagsTable.normalizedName, parsed.normalized)))
    .limit(1)

  if (existing[0] != null) {
    throw new Error('legacy name conflict')
  }

  const inserted = await db
    .insert(tagsTable)
    .values({
      userId: benchUserId,
      name: parsed.display,
      normalizedName: parsed.normalized,
      pinned: false,
      sortOrder: 0,
      color: null
    })
    .returning({ id: tagsTable.id })

  if (inserted[0] == null) {
    throw new Error('legacy insert failed')
  }
}

async function measure(label: string, run: (name: string) => Promise<void>): Promise<number[]> {
  for (let i = 0; i < WARMUP; i += 1) {
    await run(`${label}-warmup-${i}`)
  }

  const samples: number[] = []
  for (let i = 0; i < SAMPLES; i += 1) {
    const started = performance.now()
    await run(`${label}-${i}`)
    samples.push(performance.now() - started)
  }
  return samples
}

describe('CreateTag latency vs legacy SELECT+INSERT', () => {
  beforeAll(async () => {
    await db.insert(user).values({
      id: benchUserId,
      name: 'bench-create-tag',
      email: `${benchUserId}@bench.invalid`
    })
  })

  afterAll(async () => {
    await db.delete(tagsTable).where(eq(tagsTable.userId, benchUserId))
    await db.delete(user).where(eq(user.id, benchUserId))
  })

  test('warm oRPC CreateTag stays within RFC limits vs SELECT+INSERT', async () => {
    const firstLegacy = await measure('legacy-a', legacyCreateTag),
     firstLegacyStats = summarize('legacy-a', firstLegacy),

     secondLegacy = await measure('legacy-b', legacyCreateTag),
     secondLegacyStats = summarize('legacy-b', secondLegacy),

     medianDrift =
      Math.abs(secondLegacyStats.median - firstLegacyStats.median) / firstLegacyStats.median
    console.log(`legacy median drift=${(medianDrift * 100).toFixed(2)}%`)
    expect(medianDrift).toBeLessThanOrEqual(0.05)

    const client = createBenchClient(),
     orpcSamples = await measure('orpc', async (name) => {
      await client.tags.create({ name })
    }),
     orpcStats = summarize('orpc', orpcSamples),

     medianLimit = firstLegacyStats.median * 1.1,
     p95Limit = firstLegacyStats.p95 * 1.15
    console.log(`limits median<=${medianLimit.toFixed(2)}ms p95<=${p95Limit.toFixed(2)}ms`)

    expect(orpcStats.median).toBeLessThanOrEqual(medianLimit)
    expect(orpcStats.p95).toBeLessThanOrEqual(p95Limit)
  }, 120_000)
})
