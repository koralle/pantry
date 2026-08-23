import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { userIdSchema } from '../../auth/domain/auth-values'
import { tagIdSchema, tagNameSchema } from '../domain/tag-values'
import { createTagInputSchema, executeCreateTag, toCreateTagCommand } from './create-tag'
import type { InsertTag, InsertTagInput, InsertTagOutput } from './create-tag'

function parseUserId(value: string) {
  return v.parse(userIdSchema, value)
}

function parseTagId(value: number) {
  return v.parse(tagIdSchema, value)
}

function parseInput(input: unknown) {
  return v.parse(createTagInputSchema, input)
}

/**
 * 戻り値を固定した port。Drizzle のメソッドチェーンは mock しない。
 * Application は SQL の組み立てを知らない、という境界をテストが壊さないため。
 */
function fakeInsertTag(output: InsertTagOutput): InsertTag {
  return async (_input: InsertTagInput) => output
}

describe('toCreateTagCommand', () => {
  test('省略した pinned / sortOrder / color は false / 0 / null になる', () => {
    const command = toCreateTagCommand(parseInput({ name: 'Work' }))

    expect(command.name).toEqual(v.parse(tagNameSchema, 'Work'))
    expect(command.pinned).toBe(false)
    expect(command.sortOrder).toBe(0)
    expect(command.color).toBeNull()
  })

  test('明示した pinned=false / sortOrder=0 / color=null はコマンド値として残る', () => {
    const command = toCreateTagCommand(
      parseInput({
        name: 'Work',
        pinned: false,
        sortOrder: 0,
        color: null
      })
    )

    expect(command).toEqual({
      name: v.parse(tagNameSchema, 'Work'),
      pinned: false,
      sortOrder: 0,
      color: null
    })
  })
})

describe('executeCreateTag', () => {
  test('Drizzle に触れずに作成したタグ ID を返す', async () => {
    const id = parseTagId(12),
      result = await executeCreateTag({
        insertTag: fakeInsertTag({ kind: 'created', id }),
        userId: parseUserId('user-1'),
        command: toCreateTagCommand(parseInput({ name: 'Inbox' }))
      })

    expect(result).toEqual({
      ok: true,
      value: { id }
    })
  })

  test('name-conflict を tag-name-already-exists に写す', async () => {
    const result = await executeCreateTag({
      insertTag: fakeInsertTag({ kind: 'name-conflict' }),
      userId: parseUserId('user-1'),
      command: toCreateTagCommand(parseInput({ name: 'Inbox' }))
    })

    expect(result).toEqual({
      ok: false,
      error: { code: 'tag-name-already-exists' }
    })
  })

  test('明示したコマンド値を insertTag へ渡す', async () => {
    let received: InsertTagInput | undefined
    const id = parseTagId(3),
      command = toCreateTagCommand(
        parseInput({
          name: 'Later',
          pinned: false,
          sortOrder: 0,
          color: null
        })
      )

    await executeCreateTag({
      insertTag: async (input) => {
        received = input
        return { kind: 'created', id }
      },
      userId: parseUserId('user-9'),
      command
    })

    expect(received).toEqual({
      userId: parseUserId('user-9'),
      name: command.name,
      pinned: false,
      sortOrder: 0,
      color: null
    })
  })
})
