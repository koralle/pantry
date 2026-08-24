import { access, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const rpcDir = dirname(fileURLToPath(import.meta.url))
const srcDir = join(rpcDir, '..')

async function readSource(path: string): Promise<string> {
  return readFile(join(srcDir, path), 'utf8')
}

describe('client bundle boundary', () => {
  test('browser client は server 実装を静的に import しない', async () => {
    const source = await readSource('rpc/client.ts')

    expect(source).not.toMatch(/from '\.\/client\.server'/)
    expect(source).not.toMatch(/from '@tanstack\/react-start\/server'/)
    expect(source).not.toContain('handle-request.server')
    expect(source).not.toContain('getAuth')
  })

  test('runtime client は isomorphic fn 経由でのみ server 実装を選ぶ', async () => {
    const source = await readSource('rpc/runtime-client.ts')

    expect(source).toContain('createIsomorphicFn')
    expect(source).toMatch(/await import\('\.\/client\.server'\)/)
    expect(source).not.toMatch(/from '\.\/client\.server'/)
    expect(source).not.toMatch(/from '@tanstack\/react-start\/server'/)
  })

  test('RPC route は POST 専用で、GET handler を持たない', async () => {
    const source = await readSource('routes/api/rpc/$.ts')

    expect(source).toContain('POST:')
    expect(source).not.toMatch(/GET:/)
  })

  test('legacy の Server Function と旧位置の helper は存在しない', async () => {
    const removed = [
      'features/auth/functions/get-session.ts',
      'features/auth/functions/ensure-session.ts',
      'features/auth/functions/get-auth.server.ts',
      'features/auth/functions/request-session.server.ts',
      'features/tags/functions/fetch-shelf-tags.ts',
      'features/tags/functions/fetch-tags.ts',
      'features/tags/functions/get-tag.ts'
    ]
    for (const path of removed) {
      await expect(access(join(srcDir, path))).rejects.toThrow()
    }

    const moved = ['features/auth/server/get-auth.server.ts']
    for (const path of moved) {
      await expect(access(join(srcDir, path))).resolves.toBeUndefined()
    }
  })
})

describe('shelf query ownership', () => {
  test('/_protected.loader が tags.shelf を staleTime 5 秒で prefetch する', async () => {
    const source = await readSource('routes/_protected.tsx')

    expect(source).toContain('ensureQueryData')
    expect(source).toContain('tags.shelf')
    expect(source).toContain('5000')
  })

  test('/_protected.beforeLoad は auth.session で判定し redirect を載せる', async () => {
    const source = await readSource('routes/_protected.tsx')

    expect(source).toContain('auth.session')
    expect(source).toContain("to: '/sign-in'")
    expect(source).toContain('redirect:')
  })

  test('/tags route は棚を自分で取得せず parent の cache を読む', async () => {
    const source = await readSource('routes/_protected/tags/index.tsx')

    expect(source).not.toContain('fetchShelfTags')
    expect(source).not.toContain('tags.list')
    expect(source).toContain('shelfTagsPromise')
  })

  test('child loader は session を再取得しない', async () => {
    const sources = await Promise.all([
      readSource('routes/_protected/index.tsx'),
      readSource('routes/_protected/settings/index.tsx'),
      readSource('routes/_protected/tags/index.tsx'),
      readSource('routes/_protected/tags/$id/index.tsx'),
      readSource('routes/_protected/tags/$id.edit.tsx')
    ])

    for (const source of sources) {
      expect(source).not.toContain('ensureSession')
      expect(source).not.toContain('getSession')
      expect(source).not.toContain('auth.session')
    }
  })
})
