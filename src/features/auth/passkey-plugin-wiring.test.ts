import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(dir, '../../..')

async function readFromAuth(path: string): Promise<string> {
  return readFile(join(dir, path), 'utf8')
}

describe('passkey plugin wiring', () => {
  test('Worker auth keeps email+password and adds the passkey plugin', async () => {
    const source = await readFromAuth('server/get-auth.server.ts')

    expect(source).toContain('emailAndPassword: {\n      enabled: true\n    }')
    expect(source).toContain('session: {\n      freshAge: 0\n    }')
    expect(source).toContain("from '@better-auth/passkey'")
    expect(source).toContain('passkey(passkeyPluginOptions(env.BETTER_AUTH_URL))')
    expect(source).toContain('admin()')
  })

  test('Node auth CLI entry matches Worker passkey wiring', async () => {
    const source = await readFile(join(repoRoot, 'auth.ts'), 'utf8')

    expect(source).toContain('emailAndPassword: {\n    enabled: true\n  }')
    expect(source).toContain('session: {\n    freshAge: 0\n  }')
    expect(source).toContain("from '@better-auth/passkey'")
    expect(source).toContain('passkey(passkeyPluginOptions(env.BETTER_AUTH_URL))')
  })

  test('auth client installs passkeyClient', async () => {
    const source = await readFromAuth('lib/auth-client.ts')

    expect(source).toContain("from '@better-auth/passkey/client'")
    expect(source).toContain('passkeyClient()')
  })
})
