import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { userIdSchema } from '../../auth/domain/auth-values'
import { tagIdSchema } from '../domain/tag-values'
import { executeTouchTag, touchTagInputSchema } from './touch-tag'
import type { TouchTag, TouchTagInput, TouchTagOutput } from './touch-tag'

function parseUserId(value: string) {
  return v.parse(userIdSchema, value)
}

function parseTagId(value: number) {
  return v.parse(tagIdSchema, value)
}

/**
 * 戻り値を固定した port。Drizzle のメソッドチェーンは mock しない。
 * Application は SQL の組み立てを知らない、という境界をテストが壊さないため。
 */
function fakeTouchTag(output: TouchTagOutput): TouchTag {
  return async (_input: TouchTagInput) => output
}

describe('touchTagInputSchema', () => {
  test('正の整数の id を受け付ける', () => {
    expect(v.parse(touchTagInputSchema, { id: 3 })).toEqual({ id: parseTagId(3) })
  })

  test('0 以下や小数の id は拒否する', () => {
    expect(() => v.parse(touchTagInputSchema, { id: 0 })).toThrow()
    expect(() => v.parse(touchTagInputSchema, { id: 1.5 })).toThrow()
  })
})

describe('executeTouchTag', () => {
  test('touched を成功 Result に写す', async () => {
    const result = await executeTouchTag({
      touchTag: fakeTouchTag({ kind: 'touched' }),
      userId: parseUserId('user-1'),
      id: parseTagId(7)
    })

    expect(result).toEqual({ ok: true, value: undefined })
  })

  test('not-found を tag-not-found に写す', async () => {
    const result = await executeTouchTag({
      touchTag: fakeTouchTag({ kind: 'not-found' }),
      userId: parseUserId('user-1'),
      id: parseTagId(7)
    })

    expect(result).toEqual({
      ok: false,
      error: { code: 'tag-not-found' }
    })
  })

  test('actor の userId と tag id を port へ渡す', async () => {
    let received: TouchTagInput | undefined

    await executeTouchTag({
      touchTag: async (input) => {
        received = input
        return { kind: 'touched' }
      },
      userId: parseUserId('user-9'),
      id: parseTagId(12)
    })

    expect(received).toEqual({
      userId: parseUserId('user-9'),
      id: parseTagId(12)
    })
  })

  test('未知の障害は潰さず伝播する', async () => {
    const touchTag = fakeTouchTag({ kind: 'touched' })
    await expect(
      executeTouchTag({
        touchTag: async (input) => {
          await touchTag(input)
          throw new Error('disk exploded')
        },
        userId: parseUserId('user-1'),
        id: parseTagId(7)
      })
    ).rejects.toThrow('disk exploded')
  })
})
