import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))

describe('EditTagForm', () => {
  test('Errorのclass名ではなくoRPC code mapperを使う', () => {
    const source = readFileSync(join(dir, 'edit-tag-form.tsx'), 'utf8')

    expect(source).not.toContain('../functions/update-tag')
    expect(source).not.toContain('TagNameAlreadyExistsError')
    expect(source).not.toContain('error.name')
    expect(source).toContain('getUpdateTagErrorMessage')
  })
})
