import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))
const srcDir = join(dir, '../..')

async function readSource(path: string): Promise<string> {
  return readFile(join(srcDir, path), 'utf8')
}

describe('passkey UI contracts', () => {
  test('login shows an explicit passkey action before the password form', async () => {
    const page = await readSource('routes/sign-in/index.tsx')
    const passkeyIndex = page.indexOf('<PasskeySignIn')
    const passwordIndex = page.indexOf('<SignInWithEmailAndPasswordForm')

    expect(passkeyIndex).toBeGreaterThan(-1)
    expect(passwordIndex).toBeGreaterThan(passkeyIndex)

    const signIn = await readSource('features/auth/components/passkey/sign-in.tsx')
    expect(signIn).toContain('パスキーでログイン')
    expect(signIn).toContain('または')
    expect(signIn).toContain("to: redirect ?? '/'")
    expect(signIn).toContain('signIn.passkey({ autoFill: true })')
    expect(signIn).toContain('WebAuthnAbortService.cancelCeremony()')
  })

  test('settings hosts passkey management between account and session', async () => {
    const page = await readSource('routes/_protected/settings/index.tsx')
    const accountIndex = page.indexOf('アカウント')
    const passkeyIndex = page.indexOf('<PasskeySettings')
    const sessionIndex = page.indexOf('セッション')

    expect(accountIndex).toBeGreaterThan(-1)
    expect(passkeyIndex).toBeGreaterThan(accountIndex)
    expect(sessionIndex).toBeGreaterThan(passkeyIndex)
  })

  test('registration starts without collecting a display name first', async () => {
    const settings = await readSource('features/auth/components/passkey/settings.tsx')
    expect(settings).toContain('パスキーを追加')
    expect(settings).toContain('authClient.passkey.addPasskey()')
    expect(settings).not.toContain('addPasskey({')
  })

  test('display names resolve without importing the server passkey plugin', async () => {
    const source = await readSource('features/auth/lib/passkey/display-name.ts')
    expect(source).not.toContain("@better-auth/passkey'")
    expect(source).toContain('Google Password Manager')
    expect(source).toContain('1Password')
  })

  test('delete asks for confirmation before calling the API', async () => {
    const dialog = await readSource('features/auth/components/passkey/delete-dialog.tsx')
    expect(dialog).toContain('このパスキーを削除しますか？')
    expect(dialog).toContain('削除を確認')
    expect(dialog).toContain('キャンセル')
  })
})
