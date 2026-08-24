import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))

describe('EditTagScreen', () => {
  test('UpdateTagをoRPC mutationとして所有する', () => {
    const source = readFileSync(join(dir, 'edit-tag-screen.tsx'), 'utf8')

    expect(source).not.toContain('../functions/update-tag')
    expect(source).not.toContain('TagNameAlreadyExistsError')
    expect(source).not.toContain('error.name')
    expect(source).toContain('orpc.tags.update.mutationOptions')
    expect(source).toContain('refreshAfterUpdateTag')
  })
})
