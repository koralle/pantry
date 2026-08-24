import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))

describe('edit tag route', () => {
  test('UpdateTagをoRPC mutationとして所有する', () => {
    const source = readFileSync(join(dir, '$id.edit.tsx'), 'utf8')

    expect(source).not.toContain('../functions/update-tag')
    expect(source).not.toContain('TagNameAlreadyExistsError')
    expect(source).not.toContain('error.name')
    expect(source).toContain('orpc.tags.update.mutationOptions')
    expect(source).toContain('refreshAfterUpdateTag')
  })
})
