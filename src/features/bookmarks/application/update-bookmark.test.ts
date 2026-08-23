import { describe, expect, test, vi } from 'vitest'

import { bookmarkId, bookmarkNote, bookmarkTitle, bookmarkUrl, tagId, userId } from './test-helpers'
import { executeUpdateBookmark } from './update-bookmark'
import type { UpdateBookmark, UpdateBookmarkOutput } from './update-bookmark'

function createCommand(
  overrides: Partial<{
    id: ReturnType<typeof bookmarkId>
    url: ReturnType<typeof bookmarkUrl>
    title: ReturnType<typeof bookmarkTitle>
    note: ReturnType<typeof bookmarkNote>
    tags: ReturnType<typeof tagId>[]
  }> = {}
) {
  return {
    id: overrides.id ?? bookmarkId(),
    url: overrides.url ?? bookmarkUrl('https://example.com'),
    title: overrides.title ?? bookmarkTitle('Example'),
    note: overrides.note ?? bookmarkNote(null),
    tags: overrides.tags ?? []
  }
}

function createPort(output?: UpdateBookmarkOutput) {
  const port = vi.fn<UpdateBookmark>(async () => output ?? { kind: 'updated', id: bookmarkId() })
  return port
}

describe('executeUpdateBookmark', () => {
  test('成功時は port へ actor 付き command を渡し ok(id) を返す', async () => {
    const actor = userId('user-1')
    const id = bookmarkId()
    const command = createCommand({ id, tags: [tagId(1)] })
    const port = createPort()

    const result = await executeUpdateBookmark({ updateBookmark: port, userId: actor, command })

    expect(result).toStrictEqual({ ok: true, value: { id: expect.any(String) } })
    expect(port).toHaveBeenCalledOnce()
    expect(port).toHaveBeenCalledWith({
      userId: actor,
      bookmarkId: command.id,
      url: command.url,
      title: command.title,
      note: command.note,
      tagIds: [tagId(1)]
    })
  })

  test('重複する tag ID は invalid-tag になり、port を呼ばない', async () => {
    const port = createPort()
    const command = createCommand({ tags: [tagId(1), tagId(1)] })

    const result = await executeUpdateBookmark({
      updateBookmark: port,
      userId: userId('user-1'),
      command
    })

    expect(result).toStrictEqual({ ok: false, error: { code: 'invalid-tag' } })
    expect(port).not.toHaveBeenCalled()
  })

  test('bookmark-not-found を Expected Error へ写す', async () => {
    const port = createPort({ kind: 'bookmark-not-found' } as const)

    const result = await executeUpdateBookmark({
      updateBookmark: port,
      userId: userId('user-1'),
      command: createCommand()
    })

    expect(result).toStrictEqual({ ok: false, error: { code: 'bookmark-not-found' } })
  })

  test('duplicate-url を Expected Error へ写す', async () => {
    const port = createPort({ kind: 'duplicate-url' } as const)

    const result = await executeUpdateBookmark({
      updateBookmark: port,
      userId: userId('user-1'),
      command: createCommand()
    })

    expect(result).toStrictEqual({ ok: false, error: { code: 'duplicate-url' } })
  })

  test('invalid-tag を Expected Error へ写す', async () => {
    const port = createPort({ kind: 'invalid-tag' } as const)

    const result = await executeUpdateBookmark({
      updateBookmark: port,
      userId: userId('user-1'),
      command: createCommand({ tags: [tagId(2)] })
    })

    expect(result).toStrictEqual({ ok: false, error: { code: 'invalid-tag' } })
  })

  test('未知の障害は throw して伝播する', async () => {
    const port = vi.fn<UpdateBookmark>(async () => {
      throw new Error('disk exploded')
    })

    await expect(
      executeUpdateBookmark({
        updateBookmark: port,
        userId: userId('user-1'),
        command: createCommand()
      })
    ).rejects.toThrow('disk exploded')
  })
})
