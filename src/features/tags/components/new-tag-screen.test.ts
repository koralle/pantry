import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))

describe('NewTagScreen', () => {
  test('Error の class 名に依存しない', () => {
    const source = readFileSync(join(dir, 'new-tag-screen.tsx'), 'utf8')
    expect(source).not.toContain('TagNameAlreadyExistsError')
    expect(source).not.toContain('error.name')
    expect(source).toContain('getCreateTagErrorMessage')
  })
})
