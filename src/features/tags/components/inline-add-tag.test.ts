import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))

describe('InlineAddTag', () => {
  test('does not depend on Error class names', () => {
    const source = readFileSync(join(dir, 'inline-add-tag.tsx'), 'utf8')
    expect(source).not.toContain('TagNameAlreadyExistsError')
    expect(source).not.toContain('error.name')
    expect(source).toContain('getCreateTagErrorMessage')
  })
})
