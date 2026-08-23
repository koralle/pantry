import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))

describe('useTouchTagLastUsedOnce', () => {
  const source = readFileSync(join(dir, 'use-touch-tag-last-used.ts'), 'utf8')

  test('Server Function ではなく oRPC mutation を使う', () => {
    expect(source).toContain('orpc.tags.touch.mutationOptions')
    expect(source).not.toContain('functions/touch-tag-last-used')
    expect(source).not.toContain('createServerFn')
  })

  test('session expiry を hook 内で扱わない', () => {
    expect(source).not.toContain('UNAUTHORIZED')
    expect(source).not.toContain('sign-in')
  })

  test('汎用のエラー UI を持たない', () => {
    expect(source).not.toContain("role='alert'")
    expect(source).not.toContain('role="alert"')
  })
})
