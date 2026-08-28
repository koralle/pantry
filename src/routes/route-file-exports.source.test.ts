import { globSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const routesDir = dirname(fileURLToPath(import.meta.url))

function extraValueExports(source: string): string[] {
  const names = new Set<string>()

  for (const match of source.matchAll(/^export (?:async )?function (?<name>[A-Za-z_$][\w$]*)/gm)) {
    names.add(match.groups?.['name'] ?? '')
  }

  for (const match of source.matchAll(/^export const (?<name>[A-Za-z_$][\w$]*)/gm)) {
    names.add(match.groups?.['name'] ?? '')
  }

  names.delete('Route')
  names.delete('')
  return [...names].toSorted()
}

describe('TanStack Router file routes', () => {
  test('Route 以外の値を export しない', () => {
    const files = globSync('**/*.{ts,tsx}', { cwd: routesDir }).filter(
      (file) => !file.includes('.stories.') && !file.includes('.test.')
    )

    const offenders = files.flatMap((file) => {
      const extras = extraValueExports(readFileSync(join(routesDir, file), 'utf8'))
      return extras.map((name) => `${file}: ${name}`)
    })

    expect(offenders).toEqual([])
  })
})
