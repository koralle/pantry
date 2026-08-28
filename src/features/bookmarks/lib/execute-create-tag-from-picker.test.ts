import { ORPCError } from '@orpc/client'
import { describe, expect, test, vi } from 'vitest'

import { executeCreateTagFromPicker } from './execute-create-tag-from-picker'

describe('executeCreateTagFromPicker', () => {
  test('作成成功なら id と正規化した表示名を返す', async () => {
    const createTag = vi.fn(async () => ({ id: 9 }))
    const loadTags = vi.fn(async () => [])

    await expect(
      executeCreateTagFromPicker({
        name: '  Python  ',
        createTag,
        loadTags
      })
    ).resolves.toEqual({
      status: 'created',
      tag: { id: 9, name: 'Python' }
    })
    expect(loadTags).not.toHaveBeenCalled()
  })

  test('同名競合で既存タグを特定できれば重複作成せずそのタグを返す', async () => {
    const createTag = vi.fn(async () => {
      throw new ORPCError('tag-name-already-exists', { defined: true, status: 409 })
    })
    const loadTags = vi.fn(async () => [{ id: 4, name: 'Python' }])

    await expect(
      executeCreateTagFromPicker({
        name: 'python',
        createTag,
        loadTags
      })
    ).resolves.toEqual({
      status: 'created',
      tag: { id: 4, name: 'Python' }
    })
    expect(createTag).toHaveBeenCalledOnce()
    expect(loadTags).toHaveBeenCalledOnce()
  })

  test('同名競合でも既存タグを特定できなければ再試行可能な失敗にする', async () => {
    const createTag = vi.fn(async () => {
      throw new ORPCError('tag-name-already-exists', { defined: true, status: 409 })
    })
    const loadTags = vi.fn(async () => [{ id: 1, name: 'React' }])

    await expect(
      executeCreateTagFromPicker({
        name: 'Python',
        createTag,
        loadTags
      })
    ).resolves.toEqual({
      status: 'error',
      message: 'タグの作成に失敗しました'
    })
  })

  test('UNAUTHORIZED はフォームエラーにしない', async () => {
    const createTag = vi.fn(async () => {
      throw new ORPCError('UNAUTHORIZED', { defined: true })
    })

    await expect(
      executeCreateTagFromPicker({
        name: 'Python',
        createTag,
        loadTags: async () => []
      })
    ).resolves.toEqual({ status: 'idle' })
  })

  test('その他の失敗は作成エラーとして返す', async () => {
    const createTag = vi.fn(async () => {
      throw new Error('network')
    })

    await expect(
      executeCreateTagFromPicker({
        name: 'Python',
        createTag,
        loadTags: async () => []
      })
    ).resolves.toEqual({
      status: 'error',
      message: 'タグの作成に失敗しました'
    })
  })
})
