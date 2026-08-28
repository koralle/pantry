import { globSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const routesDir = dirname(fileURLToPath(import.meta.url))
const ident = String.raw`[A-Za-z_$][\w$]*`

function extraValueExports(source: string): string[] {
  const names = new Set<string>()

  const add = (name: string | undefined) => {
    if (name !== undefined && name !== '') {
      names.add(name)
    }
  }

  for (const match of source.matchAll(new RegExp(`^export (?:async )?function (${ident})`, 'gm'))) {
    add(match[1])
  }

  for (const match of source.matchAll(new RegExp(`^export class (${ident})`, 'gm'))) {
    add(match[1])
  }

  for (const match of source.matchAll(new RegExp(`^export enum (${ident})`, 'gm'))) {
    add(match[1])
  }

  for (const match of source.matchAll(new RegExp(`^export (?:const|let|var) (${ident})`, 'gm'))) {
    add(match[1])
  }

  if (/^export default\b/m.test(source)) {
    add('default')
  }

  for (const match of source.matchAll(new RegExp(`^export \\* as (${ident}) from`, 'gm'))) {
    add(match[1])
  }

  if (/^export \* from\b/m.test(source)) {
    add('*')
  }

  for (const match of source.matchAll(/^export \{([^}]*)\}/gm)) {
    for (const specifier of match[1]?.split(',') ?? []) {
      const trimmed = specifier.trim()
      if (trimmed === '' || trimmed.startsWith('type ')) {
        continue
      }
      add(
        trimmed
          .split(/\s+as\s+/u)
          .at(-1)
          ?.trim()
      )
    }
  }

  names.delete('Route')
  names.delete('')
  return [...names].toSorted()
}

describe('TanStack Router file routes', () => {
  test.each([
    ['export function RouteComponent() {}', ['RouteComponent']],
    ['export const helper = 1', ['helper']],
    ['function RouteComponent() {}\nexport { RouteComponent }', ['RouteComponent']],
    ['export default function RouteComponent() {}', ['default']],
    ['export class Foo {}', ['Foo']],
    ['export let x = 1', ['x']],
    ['export var y = 1', ['y']],
    ["export * from './other'", ['*']],
    ["export { RouteComponent } from './other'", ['RouteComponent']],
    ["export * as helpers from './other'", ['helpers']],
    ['export const Route = 1', []],
    ['export type Foo = string', []],
    ['export interface Bar {}', []],
    ['export type { Foo }', []],
    ['export { type Foo, Route }', []]
  ] as const)('%s', (source, expected) => {
    expect(extraValueExports(source)).toEqual([...expected])
  })

  test('Route 以外の値を export しない', () => {
    const files = globSync('**/*.{ts,tsx}', { cwd: routesDir }).filter(
      (file) => !/\.(?:stories|test|spec)\./.test(file)
    )

    expect(files).toContain('_protected/bookmarks/$id/edit.tsx')

    const offenders = files.flatMap((file) => {
      const extras = extraValueExports(readFileSync(join(routesDir, file), 'utf8'))
      return extras.map((name) => `${file}: ${name}`)
    })

    expect(offenders).toEqual([])
  })
})
