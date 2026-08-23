import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { userIdSchema } from '../../auth/domain/auth-values'
import { tagIdSchema, tagNameSchema } from '../domain/tag-values'
import { executeUpdateTag, toUpdateTagCommand, updateTagInputSchema } from './update-tag'
import type { UpdateTag, UpdateTagInput, UpdateTagOutput } from './update-tag'

function parseInput(input: unknown) {
  return v.parse(updateTagInputSchema, input)
}

function fakeUpdateTag(output: UpdateTagOutput): UpdateTag {
  return async (_input: UpdateTagInput) => output
}

const userId = v.parse(userIdSchema, 'user-1')
const tagId = v.parse(tagIdSchema, 7)

describe('toUpdateTagCommand', () => {
  test('wire inputをbranded commandへ変換する', () => {
    const command = toUpdateTagCommand(
      parseInput({ id: 7, name: ' Work ', pinned: false, sortOrder: 0, color: null })
    )

    expect(command).toEqual({
      id: tagId,
      name: v.parse(tagNameSchema, ' Work '),
      pinned: false,
      sortOrder: 0,
      color: null
    })
  })
})

describe('executeUpdateTag', () => {
  const command = toUpdateTagCommand(
    parseInput({ id: 7, name: 'Work', pinned: true, sortOrder: 3, color: '#fff' })
  )

  test('updatedを更新済みTagIdへ写す', async () => {
    const result = await executeUpdateTag({
      updateTag: fakeUpdateTag({ kind: 'updated', id: tagId }),
      userId,
      command
    })

    expect(result).toEqual({ ok: true, value: { id: tagId } })
  })

  test('name-conflictをtag-name-already-existsへ写す', async () => {
    const result = await executeUpdateTag({
      updateTag: fakeUpdateTag({ kind: 'name-conflict' }),
      userId,
      command
    })

    expect(result).toEqual({
      ok: false,
      error: { code: 'tag-name-already-exists' }
    })
  })

  test('not-foundをtag-not-foundへ写す', async () => {
    const result = await executeUpdateTag({
      updateTag: fakeUpdateTag({ kind: 'not-found' }),
      userId,
      command
    })

    expect(result).toEqual({ ok: false, error: { code: 'tag-not-found' } })
  })

  test('全command値とuserIdをportへ渡す', async () => {
    let received: UpdateTagInput | undefined

    await executeUpdateTag({
      updateTag: async (input) => {
        received = input
        return { kind: 'updated', id: tagId }
      },
      userId,
      command
    })

    expect(received).toEqual({ userId, ...command })
  })

  test('portの未知障害はResultへ潰さない', async () => {
    await expect(
      executeUpdateTag({
        updateTag: async () => {
          throw new Error('database offline')
        },
        userId,
        command
      })
    ).rejects.toThrow('database offline')
  })
})
