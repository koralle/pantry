import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import type { AppDb } from '../../../db/app-db'
import { userIdSchema } from '../../auth/domain/auth-values'
import { createTag } from './create-tag'

function actorId(id = 'user-1') {
  const parsed = v.safeParse(userIdSchema, id)
  if (!parsed.success) {
    throw new Error('invalid test user id')
  }
  return parsed.output
}

function mockDb(options: {
  readonly duplicateIds?: readonly number[]
  readonly insertedId?: number | null
  readonly insertError?: unknown
}): AppDb {
  const { duplicateIds = [], insertedId = 1, insertError } = options

  return {
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit() {
                  return Promise.resolve(duplicateIds.map((id) => ({ id })))
                }
              }
            }
          }
        }
      }
    },
    insert() {
      return {
        values() {
          return {
            returning() {
              if (insertError !== undefined) {
                return Promise.reject(insertError)
              }
              if (insertedId == null) {
                return Promise.resolve([])
              }
              return Promise.resolve([{ id: insertedId }])
            }
          }
        }
      }
    }
  } as unknown as AppDb
}

describe('createTag', () => {
  test('returns Ok SelectableTag on success', async () => {
    const result = await createTag({
      db: mockDb({ insertedId: 42 }),
      actorId: actorId(),
      name: '  TypeScript  '
    })

    expect(result).toStrictEqual({
      ok: true,
      value: { id: 42, name: 'typescript' }
    })
  })

  test('returns invalid-tag-name for blank name', async () => {
    const result = await createTag({
      db: mockDb({}),
      actorId: actorId(),
      name: '   '
    })

    expect(result).toStrictEqual({
      ok: false,
      error: { code: 'invalid-tag-name', field: 'name' }
    })
  })

  test('returns invalid-tag-name when name exceeds 32 characters', async () => {
    const result = await createTag({
      db: mockDb({}),
      actorId: actorId(),
      name: 'a'.repeat(33)
    })

    expect(result).toStrictEqual({
      ok: false,
      error: { code: 'invalid-tag-name', field: 'name' }
    })
  })

  test('returns duplicate-tag-name when the name already exists', async () => {
    const result = await createTag({
      db: mockDb({ duplicateIds: [7] }),
      actorId: actorId(),
      name: 'existing'
    })

    expect(result).toStrictEqual({
      ok: false,
      error: { code: 'duplicate-tag-name', field: 'name' }
    })
  })

  test('returns duplicate-tag-name on unique constraint race', async () => {
    const result = await createTag({
      db: mockDb({
        insertError: new Error('UNIQUE constraint failed: tags.user_id, tags.name')
      }),
      actorId: actorId(),
      name: 'race'
    })

    expect(result).toStrictEqual({
      ok: false,
      error: { code: 'duplicate-tag-name', field: 'name' }
    })
  })

  test('returns unexpected-error when insert returns no row', async () => {
    const result = await createTag({
      db: mockDb({ insertedId: null }),
      actorId: actorId(),
      name: 'lonely'
    })

    expect(result).toStrictEqual({
      ok: false,
      error: { code: 'unexpected-error' }
    })
  })

  test('returns unexpected-error for other DB failures', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await createTag({
      db: mockDb({ insertError: new Error('connection reset') }),
      actorId: actorId(),
      name: 'flaky'
    })

    expect(result).toStrictEqual({
      ok: false,
      error: { code: 'unexpected-error' }
    })

    consoleError.mockRestore()
  })
})
